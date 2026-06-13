import { useCallback, useEffect, useState } from 'react'
import { getTodayReservations, setVisitStatus } from '../../services/firebase'
import type { AdminReservationRow, VisitStatus } from '../../types'
import { formatDateJa, toDateKey, today } from '../../utils/date'

/** 状態バッジの見た目（待ち＝オレンジ / 呼び済み＝緑 / 完了＝グレー） */
const STATUS_BADGE: Record<VisitStatus | 'none', { label: string; cls: string }> =
  {
    waiting: { label: '待ち', cls: 'bg-brand-orange text-white' },
    called: { label: '呼び済み', cls: 'bg-brand-green text-white' },
    done: { label: '完了', cls: 'bg-gray-200 text-brand-sub' },
    none: { label: '未チェックイン', cls: 'bg-white text-brand-sub border-2 border-gray-300' },
  }

export default function AdminDashboard() {
  const [rows, setRows] = useState<AdminReservationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      setRows(await getTodayReservations())
    } catch (e) {
      console.error(e)
      setError('予約の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function changeStatus(row: AdminReservationRow, next: VisitStatus) {
    if (pending) return
    setPending(row.timeKey)
    setError('')
    try {
      await setVisitStatus(row.timeKey, next)
      setRows((prev) =>
        prev.map((r) =>
          r.timeKey === row.timeKey ? { ...r, status: next } : r,
        ),
      )
    } catch (e) {
      console.error(e)
      setError('状態の更新に失敗しました')
    } finally {
      setPending(null)
    }
  }

  const dateLabel = formatDateJa(toDateKey(today()))

  return (
    <div className="screen-body">
      <div className="mt-2 flex items-center justify-between">
        <div>
          <p className="text-[15px] text-brand-sub">本日の予約</p>
          <p className="text-[22px] font-bold">{dateLabel}</p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="min-h-[44px] rounded-xl border-2 border-gray-300 bg-white px-4 text-[16px] font-bold text-brand-text active:bg-gray-100 disabled:opacity-50"
        >
          更新
        </button>
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
            const badge = STATUS_BADGE[row.status ?? 'none']
            return (
              <li
                key={row.timeKey}
                className="rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-sm"
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
                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[15px] font-bold ${badge.cls}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <p className="text-[15px] text-brand-sub">
                    チェックイン{' '}
                    <span className="font-bold text-brand-text">
                      {row.checkInAt ?? '—'}
                    </span>
                  </p>

                  {/* 操作：待ち→呼ぶ→呼び済み→完了。未チェックイン・完了は操作なし */}
                  {row.status === 'waiting' ? (
                    <button
                      onClick={() => void changeStatus(row, 'called')}
                      disabled={pending === row.timeKey}
                      className="min-h-[44px] rounded-xl bg-brand-orange px-6 text-[18px] font-bold text-white shadow-sm active:brightness-90 disabled:opacity-50"
                    >
                      呼ぶ
                    </button>
                  ) : row.status === 'called' ? (
                    <button
                      onClick={() => void changeStatus(row, 'done')}
                      disabled={pending === row.timeKey}
                      className="min-h-[44px] rounded-xl bg-brand-green px-6 text-[18px] font-bold text-white shadow-sm active:brightness-90 disabled:opacity-50"
                    >
                      完了
                    </button>
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
