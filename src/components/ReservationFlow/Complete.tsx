import StepBar from '../Common/StepBar'
import Button from '../Common/Button'
import { formatDateJa, formatTimeJa } from '../../utils/date'
import type { DraftReservation } from '../../types'

interface CompleteProps {
  draft: DraftReservation
  onClose: () => void
}

export default function Complete({ draft, onClose }: CompleteProps) {
  return (
    <div className="screen">
      <header className="bg-brand-green px-4 py-3 text-center text-[20px] font-bold text-white shadow-md">
        予約完了
      </header>
      {/* 進捗：完了 */}
      <StepBar current={5} />

      <div className="screen-body flex flex-col">
        <div className="mt-4 flex flex-col items-center">
          {/* 緑のチェックマーク */}
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-green text-[56px] text-white">
            ✓
          </div>
          <p className="mt-4 text-[28px] font-bold text-brand-green">
            予約しました
          </p>
        </div>

        <dl className="mt-6 rounded-2xl border-2 border-brand-green bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between py-1.5">
            <dt className="text-[17px] text-brand-sub">用事</dt>
            <dd className="text-[20px] font-bold">{draft.purpose}</dd>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <dt className="text-[17px] text-brand-sub">日付</dt>
            <dd className="text-[20px] font-bold">{formatDateJa(draft.date)}</dd>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <dt className="text-[17px] text-brand-sub">時刻</dt>
            <dd className="text-[20px] font-bold">{formatTimeJa(draft.time)}</dd>
          </div>
        </dl>

        <div className="mt-6 rounded-2xl bg-orange-50 p-4 text-[17px] leading-relaxed text-brand-text">
          この後は、来院時に
          <br />
          受付で
          <span className="font-bold text-brand-orange">「受付する」</span>
          を押してください。
        </div>

        <div className="mt-auto pb-2 pt-8">
          <Button variant="green" onClick={onClose}>
            閉じる（ホームへ）
          </Button>
        </div>
      </div>
    </div>
  )
}
