import { Navigate, useNavigate } from 'react-router-dom'
import Header from '../../components/Common/Header'
import StepBar from '../../components/Common/StepBar'
import { useSession } from '../../context/SessionContext'
import { fromDateKey, isClosed, weekDays, weekdayLabel } from '../../utils/date'
import { isDayFull } from '../../utils/slots'

export default function DateSelection() {
  const navigate = useNavigate()
  const { draft, updateDraft, reservations } = useSession()

  if (!draft) return <Navigate to="/" replace />

  // 表示中の週（0=今週, 1=来週, …）は draft（SessionContext）に保持する。
  // 時刻選択へ進んで「戻る」で戻ってきても、画面の再マウントに関係なく
  // 選択していた週が復元される。
  const weekOffset = draft.weekOffset
  const setWeek = (next: number) =>
    updateDraft({ weekOffset: Math.max(0, next) })

  const back = () => navigate(draft.mode === 'existing' ? '/home' : '/')

  function select(dateKey: string) {
    updateDraft({ date: dateKey })
    navigate('/reserve/time')
  }

  const dates = weekDays(weekOffset)
  const canGoPrev = weekOffset > 0

  return (
    <div className="screen">
      <Header title="日付を選ぶ" onBack={back} />
      <StepBar current={1} />

      <div className="screen-body">
        <p className="text-center text-[22px] font-bold">
          希望の日を選んでください
        </p>

        {/* 週の切り替え（今週は「先週」を非表示、来週は常に表示） */}
        <div className="mt-4 flex items-center gap-3">
          {canGoPrev ? (
            <button
              onClick={() => setWeek(weekOffset - 1)}
              className="inline-flex min-h-[52px] items-center gap-1.5 rounded-2xl border-2 border-brand-pink bg-white px-4 py-2 text-[18px] font-bold text-brand-pink shadow-sm transition active:bg-pink-50"
            >
              <span aria-hidden="true" className="text-[22px] leading-none">
                ‹
              </span>
              先週
            </button>
          ) : null}
          <button
            onClick={() => setWeek(weekOffset + 1)}
            className="ml-auto inline-flex min-h-[52px] items-center gap-1.5 rounded-2xl border-2 border-brand-pink bg-white px-4 py-2 text-[18px] font-bold text-brand-pink shadow-sm transition active:bg-pink-50"
          >
            来週
            <span aria-hidden="true" className="text-[22px] leading-none">
              ›
            </span>
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {dates.map((key) => {
            const d = fromDateKey(key)
            const closed = isClosed(d)
            const full = isDayFull(reservations, key)
            const disabled = closed || full

            const isSat = d.getDay() === 6
            const isSun = d.getDay() === 0

            let statusLabel = '空きあり'
            if (closed) statusLabel = '休診'
            else if (full) statusLabel = '満員'

            return (
              <button
                key={key}
                onClick={() => select(key)}
                disabled={disabled}
                className={[
                  'flex min-h-[60px] items-center justify-between rounded-2xl px-5 py-3 text-left shadow-sm transition',
                  disabled
                    ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                    : 'border-2 border-brand-pink bg-white text-brand-text active:bg-pink-50',
                ].join(' ')}
              >
                <span className="text-[22px] font-bold">
                  {d.getMonth() + 1}月{d.getDate()}日
                  <span
                    className={[
                      'ml-1 text-[18px]',
                      isSun ? 'text-brand-pink' : '',
                      isSat ? 'text-blue-600' : '',
                    ].join(' ')}
                  >
                    （{weekdayLabel(d)}）
                  </span>
                </span>
                <span
                  className={[
                    'text-[16px] font-bold',
                    disabled ? 'text-gray-400' : 'text-brand-green',
                  ].join(' ')}
                >
                  {statusLabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
