interface BackButtonProps {
  onClick: () => void
  label?: string
}

/** ヘッダー左の「もどる」ボタン。大きくタップしやすく。 */
export default function BackButton({
  onClick,
  label = '戻る',
}: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[44px] items-center gap-1 rounded-xl bg-white/20 px-3 py-2 text-[18px] font-bold text-white active:bg-white/30"
      aria-label={label}
    >
      <span aria-hidden="true" className="text-[22px] leading-none">
        ◀
      </span>
      {label}
    </button>
  )
}
