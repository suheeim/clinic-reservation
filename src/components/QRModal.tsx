import { QRCodeCanvas } from 'qrcode.react'

interface QRModalProps {
  /** QRに含める会員番号 */
  memberNumber: string
  onClose: () => void
}

/**
 * 会員番号のQRコードをポップアップ表示する。
 * 番号テキストは表示せず、QRコードのみ。
 */
export default function QRModal({ memberNumber, onClose }: QRModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="会員QRコード"
    >
      <div
        className="w-full max-w-[320px] rounded-3xl bg-white p-6 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[18px] font-bold text-brand-text">
          受付でこのQRコードを
          <br />
          見せてください
        </p>

        <div className="mt-5 flex justify-center">
          <QRCodeCanvas value={memberNumber} size={220} level="M" />
        </div>

        <button
          onClick={onClose}
          className="mt-6 min-h-[52px] w-full rounded-2xl bg-brand-pink text-[18px] font-bold text-white active:brightness-90"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
