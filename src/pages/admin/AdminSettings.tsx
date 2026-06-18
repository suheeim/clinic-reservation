import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_CLINIC_SETTINGS,
  getClinicSettings,
  saveClinicSettings,
} from '../../services/firebase'
import type {
  BusinessHours,
  ClinicSettings,
  WeekdayKey,
  WeekdaySetting,
} from '../../types'
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
  }
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

const numInputCls =
  'w-20 rounded-lg border-2 border-gray-300 bg-white px-2 py-1.5 text-[15px] text-brand-text focus:border-brand-pink disabled:bg-gray-100 disabled:text-gray-400'

const selectCls =
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
                <div className="mt-2 flex flex-col gap-3">
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
