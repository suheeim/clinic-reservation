import { useEffect, useState, type MouseEvent } from 'react'
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

const MENU_WIDTH = 176

/** 開いているドロップダウン（行キーと画面上の表示位置） */
interface MenuState {
  key: string
  top: number
  left: number
}

export default function AdminDashboard() {
  const [rows, setRows] = useState<AdminReservationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [menu, setMenu] = useState<MenuState | null>(null)

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

  function openMenu(e: MouseEvent<HTMLButtonElement>, key: string) {
    if (menu?.key === key) {
      setMenu(null)
      return
    }
    const r = e.currentTarget.getBoundingClientRect()
    // バッジ直下に表示。右端からはみ出さないよう左位置をクランプする。
    const left = Math.min(r.left, window.innerWidth - MENU_WIDTH - 8)
    setMenu({ key, top: r.bottom + 4, left: Math.max(8, left) })
  }

  async function change(row: AdminReservationRow, next: VisitStatus) {
    setMenu(null)
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
  const menuRow = menu ? rows.find((r) => r.timeKey === menu.key) : undefined

  return (
    <div className="flex-1 px-4 py-5 md:px-8">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="flex items-baseline gap-3">
          <p className="text-[20px] font-bold">本日の予約</p>
          <p className="text-[16px] text-brand-sub">{dateLabel}</p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-3 rounded-lg border-2 border-brand-orange bg-orange-50 px-4 py-2 text-[15px] font-bold text-brand-orange"
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="mt-10 text-center text-[16px] text-brand-sub">
            読み込み中…
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-10 text-center text-[16px] text-brand-sub">
            本日の予約はありません
          </p>
        ) : (
          <div className="mt-4 w-fit max-w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="table-fixed border-collapse text-[14px]">
              {/* 状態列は最長バッジ「未チェックイン」が1行で収まる幅に固定し、
                  状態が変わっても列幅がぶれないようにする。 */}
              <colgroup>
                <col style={{ width: '84px' }} />
                <col style={{ width: '92px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '112px' }} />
                <col style={{ width: '156px' }} />
                <col style={{ width: '92px' }} />
              </colgroup>
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50 text-left text-brand-sub">
                  <th className="px-3 py-2 font-bold">予約時間</th>
                  <th className="px-3 py-2 font-bold">会員番号</th>
                  <th className="px-3 py-2 font-bold">名前</th>
                  <th className="px-3 py-2 font-bold">チェックイン</th>
                  <th className="px-3 py-2 font-bold">状態</th>
                  <th className="px-3 py-2 font-bold">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const meta = STATUS_META[row.status]
                  const open = menu?.key === row.timeKey
                  return (
                    <tr
                      key={row.timeKey}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-[15px] font-bold">
                        {row.time}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums text-brand-sub">
                        {row.memberNumber}
                      </td>
                      <td className="truncate px-3 py-2">{row.name}</td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                        {row.checkInAt ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        {/* 状態バッジ：タップで4状態のドロップダウン（修正・手動チェックイン） */}
                        <button
                          onClick={(e) => openMenu(e, row.timeKey)}
                          aria-haspopup="listbox"
                          aria-expanded={open}
                          aria-label={`状態：${meta.label}（タップで変更）`}
                          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-bold ${meta.badge}`}
                        >
                          {meta.label}
                          <span aria-hidden="true" className="text-[10px]">
                            ▼
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        {/* 操作：ボタンで前進。完了は「お会計」。未チェックインは操作なし。 */}
                        {row.status === 'waiting' ? (
                          <button
                            onClick={() => void change(row, 'called')}
                            disabled={busyKey === row.timeKey}
                            className="rounded-lg bg-brand-orange px-4 py-1.5 text-[14px] font-bold text-white active:brightness-90 disabled:opacity-50"
                          >
                            呼ぶ
                          </button>
                        ) : row.status === 'called' ? (
                          <button
                            onClick={() => void change(row, 'done')}
                            disabled={busyKey === row.timeKey}
                            className="rounded-lg bg-brand-green px-4 py-1.5 text-[14px] font-bold text-white active:brightness-90 disabled:opacity-50"
                          >
                            完了
                          </button>
                        ) : row.status === 'done' ? (
                          <span className="text-[14px] font-bold text-blue-600">
                            お会計
                          </span>
                        ) : (
                          <span className="text-brand-sub">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 状態変更ドロップダウン（fixed 配置で表のスクロール枠に切られないように） */}
      {menu && menuRow ? (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setMenu(null)}
            aria-hidden="true"
          />
          <ul
            role="listbox"
            style={{ top: menu.top, left: menu.left, width: MENU_WIDTH }}
            className="fixed z-30 overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-lg"
          >
            {ALL_STATUSES.map((s) => (
              <li key={s} role="option" aria-selected={menuRow.status === s}>
                <button
                  onClick={() => void change(menuRow, s)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[14px] active:bg-gray-100"
                >
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full ${STATUS_META[s].dot}`}
                    aria-hidden="true"
                  />
                  <span className="font-bold text-brand-text">
                    {STATUS_META[s].label}
                  </span>
                  {menuRow.status === s ? (
                    <span aria-hidden="true" className="ml-auto text-brand-pink">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
