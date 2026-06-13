import { useEffect, useState } from 'react'
import {
  setVisitStatus,
  subscribeTodayReservations,
} from '../../services/firebase'
import type { AdminReservationRow, VisitStatus } from '../../types'
import { formatDateJa, toDateKey, today } from '../../utils/date'

/** 状態の表示メタ（未チェックイン=グレー / 待ち=オレンジ / 呼び済み=緑 / 完了=青） */
const STATUS_META: Record<
  VisitStatus,
  { label: string; badge: string; dot: string }
> = {
  unchecked: {
    label: '未チェックイン',
    badge: 'bg-gray-200 text-brand-sub',
    dot: 'bg-gray-400',
  },
  waiting: {
    label: '待ち',
    badge: 'bg-brand-orange text-white',
    dot: 'bg-brand-orange',
  },
  called: {
    label: '呼び済み',
    badge: 'bg-brand-green text-white',
    dot: 'bg-brand-green',
  },
  done: {
    label: '完了',
    badge: 'bg-blue-600 text-white',
    dot: 'bg-blue-600',
  },
}

/** バッジのドロップダウンに並べる順 */
const ALL_STATUSES: VisitStatus[] = ['unchecked', 'waiting', 'called', 'done']

export default function AdminDashboard() {
  const [rows, setRows] = useState<AdminReservationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyKey, setBusyKey] = useState<string | null>(null)
  // バッジのドロップダウンを開いている行（timeKey）。null は閉じている。
  const [menuKey, setMenuKey] = useState<string | null>(null)

  // Firebase のリアルタイム同期。予約・状態の変化が自動で反映される。
  useEffect(() => {
    const unsubscribe = subscribeTodayReservations(
      (next) => {
        setRows(next)
        setError('')
        setLoading(false)
      },
      (e) => {
        console.error(e)
        setError('予約の取得に失敗しました')
        setLoading(false)
      },
    )
    return unsubscribe
  }, [])

  async function change(row: AdminReservationRow, next: VisitStatus) {
    setMenuKey(null)
    if (row.status === next || busyKey) return
    setBusyKey(row.timeKey)
    setError('')
    try {
      // 書き込み後はリアルタイム購読が自動で一覧を更新する。
      await setVisitStatus(row.timeKey, next)
    } catch (e) {
      console.error(e)
      setError('状態の更新に失敗しました')
    } finally {
      setBusyKey(null)
    }
  }

  const dateLabel = formatDateJa(toDateKey(today()))

  return (
    <div className="screen-body">
      {/* ドロップダウンを開いているときの外側クリック検知 */}
      {menuKey ? (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setMenuKey(null)}
          aria-hidden="true"
        />
      ) : null}

      <div className="mt-2">
        <p className="text-[15px] text-brand-sub">本日の予約</p>
        <p className="text-[22px] font-bold">{dateLabel}</p>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border-2 border-brand-orange bg-orange-50 px-4 py-3 text-[16px] font-bold text-brand-orange"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="mt-10 text-center text-[18px] text-brand-sub">
          読み込み中…
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-10 text-center text-[18px] text-brand-sub">
          本日の予約はありません
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {rows.map((row) => {
            const meta = STATUS_META[row.status]
            const open = menuKey === row.timeKey
            return (
              <li
                key={row.timeKey}
                className="relative rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[24px] font-bold leading-tight">
                      {row.time}
                    </p>
                    <p className="mt-1 text-[17px] text-brand-text">
                      {row.name}
                    </p>
                    <p className="text-[15px] text-brand-sub">
                      会員番号 {row.memberNumber}
                    </p>
                  </div>

                  {/* 状態バッジ（タップで4状態のドロップダウン＝修正・手動チェックイン） */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setMenuKey(open ? null : row.timeKey)}
                      aria-haspopup="listbox"
                      aria-expanded={open}
                      aria-label={`状態：${meta.label}（タップで変更）`}
                      className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[15px] font-bold ${meta.badge}`}
                    >
                      {meta.label}
                      <span aria-hidden="true" className="text-[12px]">
                        ▼
                      </span>
                    </button>

                    {open ? (
                      <ul
                        role="listbox"
                        className="absolute right-0 z-30 mt-1 w-44 overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-lg"
                      >
                        {ALL_STATUSES.map((s) => (
                          <li key={s} role="option" aria-selected={row.status === s}>
                            <button
                              onClick={() => void change(row, s)}
                              className="flex w-full items-center gap-2 px-3 py-3 text-left text-[16px] active:bg-gray-100"
                            >
                              <span
                                className={`h-3.5 w-3.5 shrink-0 rounded-full ${STATUS_META[s].dot}`}
                                aria-hidden="true"
                              />
                              <span className="font-bold text-brand-text">
                                {STATUS_META[s].label}
                              </span>
                              {row.status === s ? (
                                <span
                                  aria-hidden="true"
                                  className="ml-auto text-brand-pink"
                                >
                                  ✓
                                </span>
                              ) : null}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <p className="text-[15px] text-brand-sub">
                    チェックイン{' '}
                    <span className="font-bold text-brand-text">
                      {row.checkInAt ?? '—'}
                    </span>
                  </p>

                  {/* 操作：ボタンで前進。完了は「お会計」。未チェックインは操作なし。 */}
                  {row.status === 'waiting' ? (
                    <button
                      onClick={() => void change(row, 'called')}
                      disabled={busyKey === row.timeKey}
                      className="min-h-[44px] rounded-xl bg-brand-orange px-6 text-[18px] font-bold text-white shadow-sm active:brightness-90 disabled:opacity-50"
                    >
                      呼ぶ
                    </button>
                  ) : row.status === 'called' ? (
                    <button
                      onClick={() => void change(row, 'done')}
                      disabled={busyKey === row.timeKey}
                      className="min-h-[44px] rounded-xl bg-brand-green px-6 text-[18px] font-bold text-white shadow-sm active:brightness-90 disabled:opacity-50"
                    >
                      完了
                    </button>
                  ) : row.status === 'done' ? (
                    <span className="text-[18px] font-bold text-blue-600">
                      お会計
                    </span>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
