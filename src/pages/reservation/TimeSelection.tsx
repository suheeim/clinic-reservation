import { Navigate, useNavigate } from 'react-router-dom'
import Header from '../../components/Common/Header'
import StepBar from '../../components/Common/StepBar'
import { useSession } from '../../context/SessionContext'
import { formatDateJa } from '../../utils/date'
import { TIME_SLOTS, isSlotTaken } from '../../utils/slots'

export default function TimeSelection() {
  const navigate = useNavigate()
  const { draft, updateDraft, reservations } = useSession()

  if (!draft || !draft.date) return <Navigate to="/reserve/date" replace />

  function select(time: string) {
    updateDraft({ time })
    navigate('/reserve/confirm')
  }

  return (
    <div className="screen">
      <Header title="時間を選ぶ" onBack={() => navigate('/reserve/date')} />
      <StepBar current={2} />

      <div className="screen-body">
        <p className="text-center text-[16px] text-brand-sub">選んだ日</p>
        <p className="mt-1 text-center text-[24px] font-bold text-brand-pink">
          {formatDateJa(draft.date)}
        </p>

        <p className="mt-6 text-[20px] font-bold">何時が良いですか？</p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {TIME_SLOTS.map((time) => {
            const taken = isSlotTaken(reservations, draft.date, time)
            return (
              <button
                key={time}
                onClick={() => select(time)}
                disabled={taken}
                className={[
                  'flex min-h-[68px] flex-col items-center justify-center rounded-2xl px-2 py-2 shadow-sm transition',
                  taken
                    ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                    : 'bg-brand-pink text-white active:brightness-90',
                ].join(' ')}
              >
                <span className="text-[22px] font-bold">{time}</span>
                <span className="text-[15px] font-bold">
                  {taken ? '満員' : '空き'}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-5 text-center text-[15px] text-brand-sub">
          ※「満員」の時間は選べません
        </p>
      </div>
    </div>
  )
}
