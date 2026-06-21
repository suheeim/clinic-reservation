import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_CLINIC_SETTINGS,
  getClinicSettings,
  saveClinicSettings,
} from '../../services/firebase'
import type {
  BusinessHours,
  ClinicSettings,
  ClosedPeriod,
  ShortenedDay,
  WeekdayKey,
  WeekdaySetting,
} from '../../types'
import { fromDateKey, weekdayLabel } from '../../utils/date'
import { errorBoxCls, noticeBoxCls, primaryBtnCls } from './adminUi'

/** 曜日の表示順とラベル */
const WEEKDAYS: { key: WeekdayKey; label: string }[] = [
  { key: 'mon', label: '月曜' },
  { key: 'tue', label: '火曜' },
  { key: 'wed', label: '水曜' },
  { key: 'thu', label: '木曜' },
  { key: 'fri', label: '金曜' },
  { key: 'sat', label: '土曜' },
  { key: 'sun', label: '日曜' },
]

/** 営業時間のパターン（平日・土曜）の表示順とラベル */
const HOURS_PATTERNS: { key: 'weekday' | 'saturday'; label: string }[] = [
  { key: 'weekday', label: '平日（月〜金）' },
  { key: 'saturday', label: '土曜' },
]

/** 営業時間の選択肢（06:00〜22:00 を30分刻み）。 */
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = []
  for (let m = 6 * 60; m <= 22 * 60; m += 30) {
    const h = Math.floor(m / 60)
    const mm = m % 60
    out.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`)
  }
  return out
})()

/** 時刻セレクトで「休み」を表す選択肢。短縮営業で午前/午後を ー〜ー にできる。 */
const DASH = 'ー'

/**
 * 基準時間と単位から施術時間の選択肢を生成する。
 * 単位の1倍〜基準時間ぴったりまで（0分は含めない）。
 * 例：基準60・単位10 → [10,20,30,40,50,60]／基準60・単位15 → [15,30,45,60]
 */
function generateTreatmentOptions(band: number, unit: number): number[] {
  if (band <= 0 || unit <= 0) return []
  const out: number[] = []
  for (let t = unit; t <= band; t += unit) out.push(t)
  return out
}

/** 入力値を 0 以上の整数へ。空・不正は min を返す。 */
function toInt(value: string, min = 0): number {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return min
  return Math.max(min, n)
}

/** 読み込んだ設定をデフォルトとマージして欠損項目を補う（段階追加への耐性）。 */
function normalize(s: ClinicSettings): ClinicSettings {
  const d = DEFAULT_CLINIC_SETTINGS
  return {
    bandMinutes: s.bandMinutes ?? d.bandMinutes,
    slotUnit: s.slotUnit ?? d.slotUnit,
    treatmentOptions: Array.isArray(s.treatmentOptions)
      ? s.treatmentOptions
      : [],
    weekdays: { ...d.weekdays, ...(s.weekdays ?? {}) },
    hours: normalizeHours(s.hours),
    // 旧データに無ければ祝日自動休診は ON。closedPeriods は
    // Firebase が空配列を null で返すため、配列でなければ [] に補う。
    holidayAutoClose: s.holidayAutoClose ?? d.holidayAutoClose,
    closedPeriods: Array.isArray(s.closedPeriods) ? s.closedPeriods : [],
    // 臨時変更も Firebase の空配列 null 化に備えて配列でなければ [] に補う。
    temporaryClosedDays: Array.isArray(s.temporaryClosedDays)
      ? s.temporaryClosedDays
      : [],
    shortenedDays: Array.isArray(s.shortenedDays) ? s.shortenedDays : [],
  }
}

/** 日付キー（"2026-12-29"）を「2026/12/29(火)」に整える。 */
function formatClosedDate(key: string): string {
  const d = fromDateKey(key)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}(${weekdayLabel(d)})`
}

/** 期間を「2026/12/29(火) 〜 2027/01/03(日)」に。単日は片方だけ表示。 */
function formatClosedPeriod(p: ClosedPeriod): string {
  const startLabel = formatClosedDate(p.start)
  if (p.start === p.end) return startLabel
  return `${startLabel} 〜 ${formatClosedDate(p.end)}`
}

type HoursPair = { am: BusinessHours; pm: BusinessHours }

/**
 * 営業時間を平日・土曜の2パターンへ正規化する。
 * 旧構造（hours.am / hours.pm の1セット）で保存されたデータは
 * 平日・土曜の両方へ流用し、無ければデフォルトで補う。
 */
function normalizeHours(raw: unknown): ClinicSettings['hours'] {
  const d = DEFAULT_CLINIC_SETTINGS.hours
  const h = (raw ?? {}) as {
    am?: BusinessHours
    pm?: BusinessHours
    weekday?: Partial<HoursPair>
    saturday?: Partial<HoursPair>
  }
  // 旧構造（am/pm 直下）があれば両パターンの流用元にする。
  const legacy = h.am && h.pm ? { am: h.am, pm: h.pm } : undefined
  const merge = (pair: Partial<HoursPair> | undefined, def: HoursPair) => ({
    am: { ...def.am, ...(pair?.am ?? {}) },
    pm: { ...def.pm, ...(pair?.pm ?? {}) },
  })
  return {
    weekday: merge(h.weekday ?? legacy, d.weekday),
    saturday: merge(h.saturday ?? legacy, d.saturday),
  }
}

/** その日付に対応する普段の営業時間（土曜は saturday、それ以外は weekday）。 */
function usualHours(date: string, hours: ClinicSettings['hours']): HoursPair {
  return fromDateKey(date).getDay() === 6 ? hours.saturday : hours.weekday
}

/** 短縮営業の時間帯を「09:00〜12:00」/休みなら「ー〜ー」に整える。 */
function formatPeriod(h: BusinessHours | null): string {
  return h ? `${h.start}〜${h.end}` : `${DASH}〜${DASH}`
}

/**
 * 時刻セレクト変更後の時間帯を求める。
 * ーを選ぶとその時間帯は休み（null）。ーから実時刻へ戻すときは
 * 普段の値で相手側を補い、終了は開始より後に寄せる。
 */
function nextPeriod(
  cur: BusinessHours,
  field: 'start' | 'end',
  value: string,
  usual: BusinessHours,
): BusinessHours | null {
  let next: BusinessHours = { ...cur, [field]: value }
  if (value === DASH) {
    // 片方を「ー」にしたら、その時間帯は休み（両方ー）。
    next = { start: DASH, end: DASH }
  } else {
    // 相手側がーなら普段の値で補う。
    if (next.start === DASH) next.start = usual.start
    if (next.end === DASH) next.end = usual.end
    // 終了は開始より後に。
    if (next.end <= next.start) {
      const after = TIME_OPTIONS.find((t) => t > next.start)
      if (after) next.end = after
    }
  }
  return next.start === DASH && next.end === DASH ? null : next
}

const numInputCls =
  'w-20 rounded-lg border-2 border-gray-300 bg-white px-2 py-1.5 text-[15px] text-brand-text focus:border-brand-pink disabled:bg-gray-100 disabled:text-gray-400'

const selectCls =
  'rounded-lg border-2 border-gray-300 bg-white px-2 py-1.5 text-[15px] text-brand-text focus:border-brand-pink'

const dateInputCls =
  'rounded-lg border-2 border-gray-300 bg-white px-2 py-1.5 text-[15px] text-brand-text focus:border-brand-pink'

const sectionCls = 'rounded-xl border border-gray-200 bg-white p-5 shadow-sm'
const sectionTitleCls = 'text-[16px] font-bold text-brand-text'

/**
 * 管理者の基本設定（容量ベース予約モデルの段階1）。
 * 枠の基準時間・単位／施術時間の選択肢／曜日ごとの定休日と人数／営業時間。
 */
export default function AdminSettings() {
  const [settings, setSettings] = useState<ClinicSettings>(
    DEFAULT_CLINIC_SETTINGS,
  )
  const [baseStaff, setBaseStaff] = useState(1)
  // 特定休診日の入力中の名前・開始日・終了日（追加するまでの一時値）。
  const [periodLabel, setPeriodLabel] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  // 臨時休診で追加する日付（追加するまでの一時値）。
  const [tempClosedDate, setTempClosedDate] = useState('')
  // 短縮営業の入力中の日付・午前・午後（追加するまでの一時値）。
  // am/pm が null の時間帯は休み（ー〜ー）。
  const [shortenedDate, setShortenedDate] = useState('')
  const [shortenedAm, setShortenedAm] = useState<BusinessHours | null>(null)
  const [shortenedPm, setShortenedPm] = useState<BusinessHours | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let active = true
    getClinicSettings()
      .then((s) => {
        if (!active) return
        setSettings(s ? normalize(s) : DEFAULT_CLINIC_SETTINGS)
        setLoading(false)
      })
      .catch((e) => {
        console.error(e)
        if (!active) return
        setError('設定の読み込みに失敗しました')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // 基準時間・単位から施術時間の選択肢を導出（依存が変われば再生成）。
  const treatmentChoices = useMemo(
    () => generateTreatmentOptions(settings.bandMinutes, settings.slotUnit),
    [settings.bandMinutes, settings.slotUnit],
  )

  // 設定を更新するたび「保存しました」表示を消し、エラーもクリアする。
  function mutate(fn: (s: ClinicSettings) => ClinicSettings) {
    setSettings(fn)
    setSaved(false)
    setError('')
  }

  // 基準時間・単位の変更時は、範囲外になったチェックを落として再生成する。
  function updateBand(v: number) {
    mutate((s) => {
      const next = generateTreatmentOptions(v, s.slotUnit)
      return {
        ...s,
        bandMinutes: v,
        treatmentOptions: s.treatmentOptions.filter((t) => next.includes(t)),
      }
    })
  }

  function updateUnit(v: number) {
    mutate((s) => {
      const next = generateTreatmentOptions(s.bandMinutes, v)
      return {
        ...s,
        slotUnit: v,
        treatmentOptions: s.treatmentOptions.filter((t) => next.includes(t)),
      }
    })
  }

  function toggleTreatment(opt: number) {
    mutate((s) => {
      const has = s.treatmentOptions.includes(opt)
      const treatmentOptions = has
        ? s.treatmentOptions.filter((t) => t !== opt)
        : [...s.treatmentOptions, opt].sort((a, b) => a - b)
      return { ...s, treatmentOptions }
    })
  }

  function updateWeekday(key: WeekdayKey, patch: Partial<WeekdaySetting>) {
    mutate((s) => ({
      ...s,
      weekdays: { ...s.weekdays, [key]: { ...s.weekdays[key], ...patch } },
    }))
  }

  // 基本人数を、定休日以外の全曜日の午前・午後へ一斉反映する。
  function applyBulk() {
    mutate((s) => {
      const weekdays = { ...s.weekdays }
      for (const { key } of WEEKDAYS) {
        if (weekdays[key].closed) continue
        weekdays[key] = { ...weekdays[key], am: baseStaff, pm: baseStaff }
      }
      return { ...s, weekdays }
    })
  }

  // 開始を変えて終了が前にならないよう、必要なら終了を直後の時刻へ寄せる。
  function updateHours(
    pattern: 'weekday' | 'saturday',
    period: 'am' | 'pm',
    field: 'start' | 'end',
    value: string,
  ) {
    mutate((s) => {
      const h = { ...s.hours[pattern][period], [field]: value }
      if (field === 'start' && h.end <= value) {
        const next = TIME_OPTIONS.find((t) => t > value)
        if (next) h.end = next
      }
      return {
        ...s,
        hours: {
          ...s.hours,
          [pattern]: { ...s.hours[pattern], [period]: h },
        },
      }
    })
  }

  // 開始日・終了日が両方入っていて開始日 ≤ 終了日のときだけ追加できる。
  const canAddPeriod = !!periodStart && !!periodEnd && periodStart <= periodEnd

  function addClosedPeriod() {
    if (!canAddPeriod) return
    // 名前は任意。空のときは label を付けない（undefined を保存しない）。
    const label = periodLabel.trim()
    const period: ClosedPeriod = label
      ? { start: periodStart, end: periodEnd, label }
      : { start: periodStart, end: periodEnd }
    mutate((s) => ({
      ...s,
      closedPeriods: [...s.closedPeriods, period].sort((a, b) =>
        a.start.localeCompare(b.start),
      ),
    }))
    setPeriodLabel('')
    setPeriodStart('')
    setPeriodEnd('')
  }

  function removeClosedPeriod(index: number) {
    mutate((s) => ({
      ...s,
      closedPeriods: s.closedPeriods.filter((_, i) => i !== index),
    }))
  }

  // 開始日を変えたら、終了日が前にならないよう開始日へ寄せる。
  function updatePeriodStart(value: string) {
    setPeriodStart(value)
    if (periodEnd && periodEnd < value) setPeriodEnd(value)
  }

  // ── 臨時休診（1日だけの急な休み） ──
  // 日付が入っていて、まだ登録されていない日付のときだけ追加できる。
  const canAddTempClosed =
    !!tempClosedDate && !settings.temporaryClosedDays.includes(tempClosedDate)

  function addTemporaryClosedDay() {
    if (!canAddTempClosed) return
    mutate((s) => ({
      ...s,
      temporaryClosedDays: [...s.temporaryClosedDays, tempClosedDate].sort(
        (a, b) => a.localeCompare(b),
      ),
    }))
    setTempClosedDate('')
  }

  function removeTemporaryClosedDay(index: number) {
    mutate((s) => ({
      ...s,
      temporaryClosedDays: s.temporaryClosedDays.filter((_, i) => i !== index),
    }))
  }

  // ── 短縮営業（その日だけ営業時間が違う） ──
  // 日付が入っていて、まだ登録されていない日付のときだけ追加できる。
  const canAddShortened =
    !!shortenedDate && !settings.shortenedDays.some((d) => d.date === shortenedDate)

  // 日付を選んだら、入力エリアの午前・午後に普段の営業時間を初期値で入れる。
  function updateShortenedDate(value: string) {
    setShortenedDate(value)
    setSaved(false)
    setError('')
    if (value) {
      const usual = usualHours(value, settings.hours)
      setShortenedAm({ ...usual.am })
      setShortenedPm({ ...usual.pm })
    } else {
      setShortenedAm(null)
      setShortenedPm(null)
    }
  }

  // 入力エリアの午前・午後の時刻を変更する。
  function updateShortenedDraftHours(
    period: 'am' | 'pm',
    field: 'start' | 'end',
    value: string,
  ) {
    const cur = (period === 'am' ? shortenedAm : shortenedPm) ?? {
      start: DASH,
      end: DASH,
    }
    const usual = shortenedDate
      ? usualHours(shortenedDate, settings.hours)[period]
      : settings.hours.weekday[period]
    const next = nextPeriod(cur, field, value, usual)
    if (period === 'am') setShortenedAm(next)
    else setShortenedPm(next)
    setSaved(false)
    setError('')
  }

  function addShortenedDay() {
    if (!canAddShortened) return
    const day: ShortenedDay = {
      date: shortenedDate,
      am: shortenedAm,
      pm: shortenedPm,
    }
    mutate((s) => ({
      ...s,
      shortenedDays: [...s.shortenedDays, day].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    }))
    setShortenedDate('')
    setShortenedAm(null)
    setShortenedPm(null)
  }

  function removeShortenedDay(index: number) {
    mutate((s) => ({
      ...s,
      shortenedDays: s.shortenedDays.filter((_, i) => i !== index),
    }))
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await saveClinicSettings(settings)
      setSaved(true)
    } catch (e) {
      console.error(e)
      setError('保存に失敗しました。もう一度お試しください')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 px-4 py-5 md:px-8">
        <p className="mt-10 text-center text-[16px] text-brand-sub">
          読み込み中…
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 px-4 py-5 md:px-8">
      <div className="mx-auto w-full max-w-[720px] space-y-5">
        {/* (A) 枠の基準時間・枠の単位 */}
        <section className={sectionCls}>
          <h2 className={sectionTitleCls}>枠の基準時間・枠の単位</h2>
          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-[14px] font-bold text-brand-text">
              枠の基準時間
              <input
                type="number"
                min={0}
                value={settings.bandMinutes}
                onChange={(e) => updateBand(toInt(e.target.value))}
                className={numInputCls}
              />
              分
            </label>
            <label className="flex items-center gap-2 text-[14px] font-bold text-brand-text">
              枠の単位
              <input
                type="number"
                min={0}
                value={settings.slotUnit}
                onChange={(e) => updateUnit(toInt(e.target.value))}
                className={numInputCls}
              />
              分
            </label>
          </div>
        </section>

        {/* (B) 施術時間の選択肢（自動生成＋チェック） */}
        <section className={sectionCls}>
          <h2 className={sectionTitleCls}>施術時間の選択肢</h2>
          <p className="mt-1 text-[13px] text-brand-sub">
            基準時間と単位から自動生成されます。提供するものにチェックしてください。
          </p>
          <div className="mt-4">
            {treatmentChoices.length === 0 ? (
              <p className="text-[14px] text-brand-sub">
                基準時間と単位を入力すると選択肢が表示されます。
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {treatmentChoices.map((opt) => {
                  const checked = settings.treatmentOptions.includes(opt)
                  return (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-[14px] font-bold ${
                        checked
                          ? 'border-brand-pink bg-pink-50 text-brand-pink'
                          : 'border-gray-300 text-brand-text'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTreatment(opt)}
                        className="h-4 w-4 accent-brand-pink"
                      />
                      {opt}分
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* (C) 曜日ごとの定休日＋先生人数 */}
        <section className={sectionCls}>
          <h2 className={sectionTitleCls}>曜日ごとの定休日・先生人数</h2>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[14px] font-bold text-brand-text">
              基本人数
              <input
                type="number"
                min={0}
                value={baseStaff}
                onChange={(e) => setBaseStaff(toInt(e.target.value))}
                className={numInputCls}
              />
              人
            </label>
            <button
              onClick={applyBulk}
              className="rounded-lg border-2 border-gray-300 bg-white px-3 py-1.5 text-[14px] font-bold text-brand-text transition active:bg-gray-100"
            >
              一括設定
            </button>
            <span className="text-[13px] text-brand-sub">
              （定休日以外の全曜日に反映。例外はあとで個別に直せます）
            </span>
          </div>

          <table className="mt-4 w-full text-[14px]">
            <thead>
              <tr className="text-brand-sub">
                <th className="py-1 text-left font-bold">曜日</th>
                <th className="py-1 text-center font-bold">定休日</th>
                <th className="py-1 text-center font-bold">午前</th>
                <th className="py-1 text-center font-bold">午後</th>
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map(({ key, label }) => {
                const w = settings.weekdays[key]
                return (
                  <tr key={key} className="border-t border-gray-100">
                    <td className="py-2 font-bold text-brand-text">{label}</td>
                    <td className="py-2 text-center">
                      <input
                        type="checkbox"
                        checked={w.closed}
                        onChange={(e) =>
                          updateWeekday(
                            key,
                            // 定休日にすると人数は0に。外したときは0のまま。
                            e.target.checked
                              ? { closed: true, am: 0, pm: 0 }
                              : { closed: false },
                          )
                        }
                        aria-label={`${label}を定休日にする`}
                        className="h-5 w-5 accent-brand-pink"
                      />
                    </td>
                    <td className="py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={w.am}
                        disabled={w.closed}
                        onChange={(e) =>
                          updateWeekday(key, { am: toInt(e.target.value) })
                        }
                        aria-label={`${label}の午前の人数`}
                        className={numInputCls}
                      />
                    </td>
                    <td className="py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={w.pm}
                        disabled={w.closed}
                        onChange={(e) =>
                          updateWeekday(key, { pm: toInt(e.target.value) })
                        }
                        aria-label={`${label}の午後の人数`}
                        className={numInputCls}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

        {/* (D) 営業時間（平日・土曜の2パターン） */}
        <section className={sectionCls}>
          <h2 className={sectionTitleCls}>営業時間</h2>
          <div className="mt-4 flex flex-col gap-5">
            {HOURS_PATTERNS.map(({ key: pattern, label: patternLabel }) => (
              <div key={pattern}>
                <p className="text-[14px] font-bold text-brand-text">
                  {patternLabel}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2">
                  {(['am', 'pm'] as const).map((period) => {
                    const h = settings.hours[pattern][period]
                    const label = period === 'am' ? '午前' : '午後'
                    return (
                      <div key={period} className="flex items-center gap-2">
                        <span className="w-12 text-[14px] font-bold text-brand-text">
                          {label}
                        </span>
                        <select
                          value={h.start}
                          onChange={(e) =>
                            updateHours(pattern, period, 'start', e.target.value)
                          }
                          aria-label={`${patternLabel}${label}の開始時刻`}
                          className={selectCls}
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <span className="text-brand-sub">〜</span>
                        <select
                          value={h.end}
                          onChange={(e) =>
                            updateHours(pattern, period, 'end', e.target.value)
                          }
                          aria-label={`${patternLabel}${label}の終了時刻`}
                          className={selectCls}
                        >
                          {TIME_OPTIONS.filter((t) => t > h.start).map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* (E) 休みの設定（祝日自動休診＋特定休診日） */}
        <section className={sectionCls}>
          <h2 className={sectionTitleCls}>休みの設定</h2>

          {/* 祝日自動休診トグル */}
          <div className="mt-4">
            <p className="text-[14px] font-bold text-brand-text">祝日</p>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-[14px] text-brand-text">
              <input
                type="checkbox"
                checked={settings.holidayAutoClose}
                onChange={(e) =>
                  mutate((s) => ({
                    ...s,
                    holidayAutoClose: e.target.checked,
                  }))
                }
                className="h-5 w-5 accent-brand-pink"
              />
              日本の祝日を自動で休診にする
            </label>
          </div>

          {/* 特定休診日（期間リスト） */}
          <div className="mt-5">
            <p className="text-[14px] font-bold text-brand-text">
              特定休診日（年末年始・お盆など）
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-[14px] text-brand-text">
                名前
                <input
                  type="text"
                  value={periodLabel}
                  onChange={(e) => {
                    setPeriodLabel(e.target.value)
                    setSaved(false)
                    setError('')
                  }}
                  placeholder="年末年始など（任意）"
                  aria-label="特定休診日の名前"
                  className={`${dateInputCls} w-40`}
                />
              </label>
              <label className="flex items-center gap-1.5 text-[14px] text-brand-text">
                開始日
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => updatePeriodStart(e.target.value)}
                  aria-label="特定休診日の開始日"
                  className={dateInputCls}
                />
              </label>
              <label className="flex items-center gap-1.5 text-[14px] text-brand-text">
                終了日
                <input
                  type="date"
                  value={periodEnd}
                  min={periodStart || undefined}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  aria-label="特定休診日の終了日"
                  className={dateInputCls}
                />
              </label>
              <button
                onClick={addClosedPeriod}
                disabled={!canAddPeriod}
                className="rounded-lg border-2 border-gray-300 bg-white px-3 py-1.5 text-[14px] font-bold text-brand-text transition active:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400"
              >
                追加
              </button>
            </div>

            {settings.closedPeriods.length > 0 ? (
              <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
                {settings.closedPeriods.map((p, i) => (
                  <li
                    key={`${p.start}-${p.end}-${i}`}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-[14px] text-brand-text">
                      {p.label ? (
                        <span className="font-bold">{p.label}　</span>
                      ) : null}
                      {formatClosedPeriod(p)}
                    </span>
                    <button
                      onClick={() => removeClosedPeriod(i)}
                      className="rounded-lg border-2 border-gray-300 bg-white px-3 py-1 text-[13px] font-bold text-brand-text transition active:bg-gray-100"
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13px] text-brand-sub">
                登録された特定休診日はありません。
              </p>
            )}
          </div>

          {/* 臨時休診（1日だけの急な休み） */}
          <div className="mt-5">
            <p className="text-[14px] font-bold text-brand-text">
              臨時休診（1日だけの急な休み）
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-[14px] text-brand-text">
                日付
                <input
                  type="date"
                  value={tempClosedDate}
                  onChange={(e) => setTempClosedDate(e.target.value)}
                  aria-label="臨時休診の日付"
                  className={dateInputCls}
                />
              </label>
              <button
                onClick={addTemporaryClosedDay}
                disabled={!canAddTempClosed}
                className="rounded-lg border-2 border-gray-300 bg-white px-3 py-1.5 text-[14px] font-bold text-brand-text transition active:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400"
              >
                追加
              </button>
            </div>

            {settings.temporaryClosedDays.length > 0 ? (
              <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
                {settings.temporaryClosedDays.map((d, i) => (
                  <li
                    key={`${d}-${i}`}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-[14px] text-brand-text">
                      {formatClosedDate(d)}
                    </span>
                    <button
                      onClick={() => removeTemporaryClosedDay(i)}
                      className="rounded-lg border-2 border-gray-300 bg-white px-3 py-1 text-[13px] font-bold text-brand-text transition active:bg-gray-100"
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13px] text-brand-sub">
                登録された臨時休診はありません。
              </p>
            )}
          </div>

          {/* 短縮営業（その日だけ時間が違う） */}
          <div className="mt-5">
            <p className="text-[14px] font-bold text-brand-text">
              短縮営業（その日だけ時間が違う）
            </p>

            {/* 入力エリア：日付 → 午前・午後 → 追加 */}
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-[14px] text-brand-text">
                  日付
                  <input
                    type="date"
                    value={shortenedDate}
                    onChange={(e) => updateShortenedDate(e.target.value)}
                    aria-label="短縮営業の日付"
                    className={dateInputCls}
                  />
                </label>
                <button
                  onClick={addShortenedDay}
                  disabled={!canAddShortened}
                  className="rounded-lg border-2 border-gray-300 bg-white px-3 py-1.5 text-[14px] font-bold text-brand-text transition active:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400"
                >
                  追加
                </button>
              </div>

              {shortenedDate ? (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {(['am', 'pm'] as const).map((period) => {
                    const cur =
                      (period === 'am' ? shortenedAm : shortenedPm) ?? {
                        start: DASH,
                        end: DASH,
                      }
                    const label = period === 'am' ? '午前' : '午後'
                    const endOptions =
                      cur.start === DASH
                        ? TIME_OPTIONS
                        : TIME_OPTIONS.filter((t) => t > cur.start)
                    return (
                      <div key={period} className="flex items-center gap-2">
                        <span className="w-12 text-[14px] font-bold text-brand-text">
                          {label}
                        </span>
                        <select
                          value={cur.start}
                          onChange={(e) =>
                            updateShortenedDraftHours(
                              period,
                              'start',
                              e.target.value,
                            )
                          }
                          aria-label={`短縮営業の${label}の開始時刻`}
                          className={selectCls}
                        >
                          {[DASH, ...TIME_OPTIONS].map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <span className="text-brand-sub">〜</span>
                        <select
                          value={cur.end}
                          onChange={(e) =>
                            updateShortenedDraftHours(
                              period,
                              'end',
                              e.target.value,
                            )
                          }
                          aria-label={`短縮営業の${label}の終了時刻`}
                          className={selectCls}
                        >
                          {[DASH, ...endOptions].map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>

            {settings.shortenedDays.length > 0 ? (
              <ul className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
                {settings.shortenedDays.map((day, i) => (
                  <li
                    key={`${day.date}-${i}`}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-[14px] text-brand-text">
                      {formatClosedDate(day.date)}　午前 {formatPeriod(day.am)} /
                      午後 {formatPeriod(day.pm)}
                    </span>
                    <button
                      onClick={() => removeShortenedDay(i)}
                      className="rounded-lg border-2 border-gray-300 bg-white px-3 py-1 text-[13px] font-bold text-brand-text transition active:bg-gray-100"
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13px] text-brand-sub">
                登録された短縮営業はありません。
              </p>
            )}
          </div>
        </section>

        {error ? (
          <div role="alert" className={errorBoxCls}>
            <span aria-hidden="true">⚠</span>
            <span>{error}</span>
          </div>
        ) : null}
        {saved ? <div className={noticeBoxCls}>保存しました</div> : null}

        <button
          onClick={handleSave}
          disabled={saving}
          className={primaryBtnCls}
        >
          {saving ? '保存中…' : '保存する'}
        </button>
      </div>
    </div>
  )
}
