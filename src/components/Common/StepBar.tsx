interface StepBarProps {
  /** 現在のステップ（1〜4）。完了は 5 を渡す。 */
  current: number
  total?: number
}

const LABELS = ['日にち', '時間', 'かくにん', '完了']

/** 進捗を示すステップバー。「ステップ1/4」と文字でも表示。 */
export default function StepBar({ current, total = 4 }: StepBarProps) {
  const isDone = current > total
  return (
    <div className="px-5 pt-4">
      <p className="mb-2 text-center text-[16px] font-bold text-brand-sub">
        {isDone ? '完了' : `ステップ ${current} / ${total}`}
      </p>
      <div className="flex gap-1.5" role="list" aria-label="進捗">
        {LABELS.map((label, i) => {
          const stepNo = i + 1
          const reached = isDone || stepNo <= current
          return (
            <div key={label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={[
                  'h-2.5 w-full rounded-full',
                  reached ? 'bg-brand-pink' : 'bg-gray-300',
                ].join(' ')}
                role="listitem"
              />
              <span
                className={[
                  'text-[12px]',
                  reached ? 'font-bold text-brand-pink' : 'text-brand-sub',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
