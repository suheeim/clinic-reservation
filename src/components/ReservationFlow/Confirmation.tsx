import Header from '../Common/Header'
import StepBar from '../Common/StepBar'
import Button from '../Common/Button'
import { formatDateJa, formatTimeJa } from '../../utils/date'
import type { DraftReservation } from '../../types'

interface ConfirmationProps {
  draft: DraftReservation
  saving: boolean
  error: string
  onBack: () => void
  onConfirm: () => void
}

export default function Confirmation({
  draft,
  saving,
  error,
  onBack,
  onConfirm,
}: ConfirmationProps) {
  return (
    <div className="screen">
      <Header title="かくにん" onBack={onBack} />
      <StepBar current={3} />

      <div className="screen-body flex flex-col">
        <p className="text-center text-[22px] font-bold">
          このないようで
          <br />
          よろしいですか？
        </p>

        <dl className="mt-6 divide-y divide-gray-200 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between py-3">
            <dt className="text-[17px] text-brand-sub">ようじ</dt>
            <dd className="text-[20px] font-bold">{draft.purpose}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-[17px] text-brand-sub">日にち</dt>
            <dd className="text-[20px] font-bold">{formatDateJa(draft.date)}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-[17px] text-brand-sub">時こく</dt>
            <dd className="text-[20px] font-bold text-brand-pink">
              {formatTimeJa(draft.time)}
            </dd>
          </div>
        </dl>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border-2 border-brand-orange bg-orange-50 px-4 py-3 text-[17px] font-bold text-brand-orange"
          >
            ⚠ {error}
          </div>
        ) : null}

        {/* ボタンは縦並び。予約するを大きく目立たせる。 */}
        <div className="mt-auto flex flex-col gap-3 pb-2 pt-8">
          <Button variant="pink" onClick={onConfirm} disabled={saving}>
            {saving ? 'よやく中…' : 'この日で 予約する'}
          </Button>
          <Button variant="gray" onClick={onBack} disabled={saving}>
            もどる
          </Button>
        </div>
      </div>
    </div>
  )
}
