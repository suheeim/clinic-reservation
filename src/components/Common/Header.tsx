import BackButton from './BackButton'

interface HeaderProps {
  title: string
  onBack?: () => void
}

/** 画面上部のヘッダー。タイトル + 戻るボタン（任意）。 */
export default function Header({ title, onBack }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-brand-pink px-4 py-3 text-white shadow-md">
      <div className="flex items-center gap-2">
        <div className="w-[110px] shrink-0">
          {onBack ? <BackButton onClick={onBack} /> : null}
        </div>
        <h1 className="flex-1 text-center text-[20px] font-bold">{title}</h1>
        <div className="w-[110px] shrink-0" aria-hidden="true" />
      </div>
    </header>
  )
}
