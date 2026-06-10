import { useState } from 'react'
import Header from '../Common/Header'
import StepBar from '../Common/StepBar'
import {
  addDays,
  isClosed,
  toDateKey,
  today,
  weekdayLabel,
} from '../../utils/date'
import { isDayFull } from '../../utils/slots'

interface DateSelectionProps {
  counts: Record<string, number>
  onBack: () => void
  onSelect: (dateKey: string) => void
}

export default function DateSelection({
  counts,
  onBack,
  onSelect,
}: DateSelectionProps) {
  // 週の起点（今日からのオフセット週）
  const [weekOffset, setWeekOffset] = useState(0)
  const base = today()
  const weekStart = addDays(base, weekOffset * 7)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="screen">
      <Header title="日にちを えらぶ" onBack={onBack} />
      <StepBar current={1} />

      <div className="screen-body">
        <p className="text-center text-[22px] font-bold">
          いつ みてもらいますか？
        </p>

        {/* 週の切り替え */}
        <div className="mt-5 flex items-center justify-between gap-2">
          <button
            onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
            disabled={weekOffset === 0}
            className="min-h-[48px] flex-1 rounded-xl bg-white px-3 py-2 text-[17px] font-bold text-brand-text shadow-sm disabled:opacity-40"
          >
            ◀ 前の週
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="min-h-[48px] flex-1 rounded-xl bg-white px-3 py-2 text-[17px] font-bold text-brand-text shadow-sm"
          >
            次の週 ▶
          </button>
        </div>

        {/* 日付ボタン（縦に並べて押しやすく） */}
        <div className="mt-5 flex flex-col gap-3">
          {days.map((d) => {
            const key = toDateKey(d)
            const past = d < base
            const closed = isClosed(d)
            const full = isDayFull(counts, key)
            const disabled = past || closed || full

            const isSat = d.getDay() === 6
            const isSun = d.getDay() === 0

            let statusLabel = 'あいています'
            if (closed) statusLabel = 'おやすみ'
            else if (full) statusLabel = 'うまっています'
            else if (past) statusLabel = '—'

            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                disabled={disabled}
                className={[
                  'flex min-h-[60px] items-center justify-between rounded-2xl px-5 py-3 text-left shadow-sm transition',
                  disabled
                    ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                    : 'bg-white text-brand-text active:bg-pink-50 border-2 border-brand-pink',
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
