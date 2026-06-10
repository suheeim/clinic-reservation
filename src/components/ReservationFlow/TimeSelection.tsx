import Header from '../Common/Header'
import StepBar from '../Common/StepBar'
import { formatDateJa } from '../../utils/date'
import { TIME_SLOTS, isSlotFull } from '../../utils/slots'

interface TimeSelectionProps {
  date: string
  counts: Record<string, number>
  onBack: () => void
  onSelect: (time: string) => void
}

export default function TimeSelection({
  date,
  counts,
  onBack,
  onSelect,
}: TimeSelectionProps) {
  return (
    <div className="screen">
      <Header title="時間を えらぶ" onBack={onBack} />
      <StepBar current={2} />

      <div className="screen-body">
        <p className="text-center text-[16px] text-brand-sub">えらんだ日</p>
        <p className="mt-1 text-center text-[24px] font-bold text-brand-pink">
          {formatDateJa(date)}
        </p>

        <p className="mt-6 text-[20px] font-bold">なん時が いいですか？</p>

        {/* 2列グリッド */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {TIME_SLOTS.map((time) => {
            const full = isSlotFull(counts, date, time)
            return (
              <button
                key={time}
                onClick={() => onSelect(time)}
                disabled={full}
                className={[
                  'flex min-h-[68px] flex-col items-center justify-center rounded-2xl px-2 py-2 shadow-sm transition',
                  full
                    ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                    : 'bg-brand-pink text-white active:brightness-90',
                ].join(' ')}
              >
                <span className="text-[22px] font-bold">{time}</span>
                <span className="text-[15px] font-bold">
                  {full ? 'いっぱい' : 'あき'}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-5 text-center text-[15px] text-brand-sub">
          ※「いっぱい」の 時間は えらべません
        </p>
      </div>
    </div>
  )
}
