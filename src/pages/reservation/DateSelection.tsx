import { Navigate, useNavigate } from 'react-router-dom'
import Header from '../../components/Common/Header'
import StepBar from '../../components/Common/StepBar'
import { useSession } from '../../context/SessionContext'
import { fromDateKey, isClosed, nextDays, weekdayLabel } from '../../utils/date'
import { isDayFull } from '../../utils/slots'

const DAYS = 14

export default function DateSelection() {
  const navigate = useNavigate()
  const { draft, updateDraft, reservations } = useSession()

  if (!draft) return <Navigate to="/" replace />

  const back = () => navigate(draft.mode === 'existing' ? '/home' : '/')

  function select(dateKey: string) {
    updateDraft({ date: dateKey })
    navigate('/reserve/time')
  }

  const dates = nextDays(DAYS)

  return (
    <div className="screen">
      <Header title="日付を選ぶ" onBack={back} />
      <StepBar current={1} />

      <div className="screen-body">
        <p className="text-center text-[22px] font-bold">
          希望の日を選んでください
        </p>

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
