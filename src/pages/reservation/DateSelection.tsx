import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Header from '../../components/Common/Header'
import StepBar from '../../components/Common/StepBar'
import { useSession } from '../../context/SessionContext'
import {
  fromDateKey,
  isClosed,
  isPast,
  weekDays,
  weekdayLabel,
} from '../../utils/date'
import { isDayFull } from '../../utils/slots'

export default function DateSelection() {
  const navigate = useNavigate()
  const { draft, updateDraft, reservations } = useSession()
  // 表示中の週（0=今週, 1=来週, …）。先週方向（負）には進めない。
  const [weekOffset, setWeekOffset] = useState(0)

  if (!draft) return <Navigate to="/" replace />

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

        {/* 週の切り替え */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            disabled={!canGoPrev}
            className={[
              'min-h-[52px] flex-1 rounded-2xl px-4 py-2 text-[18px] font-bold shadow-sm transition',
              canGoPrev
                ? 'border-2 border-brand-pink bg-white text-brand-pink active:bg-pink-50'
                : 'cursor-not-allowed bg-gray-200 text-gray-400',
            ].join(' ')}
          >
            ← 先週
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="min-h-[52px] flex-1 rounded-2xl border-2 border-brand-pink bg-white px-4 py-2 text-[18px] font-bold text-brand-pink shadow-sm transition active:bg-pink-50"
          >
            来週 →
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {dates.map((key) => {
            const d = fromDateKey(key)
            const past = isPast(d)
            const closed = isClosed(d)
            const full = isDayFull(reservations, key)
            const disabled = past || closed || full

            const isSat = d.getDay() === 6
            const isSun = d.getDay() === 0

            let statusLabel = '空きあり'
            if (past) statusLabel = '受付終了'
            else if (closed) statusLabel = '休診'
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
