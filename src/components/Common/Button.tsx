import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'pink' | 'green' | 'orange' | 'gray'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const VARIANT_CLASS: Record<Variant, string> = {
  pink: 'bg-brand-pink text-white active:brightness-90',
  green: 'bg-brand-green text-white active:brightness-90',
  orange: 'bg-brand-orange text-white active:brightness-90',
  gray: 'bg-white text-brand-text border-2 border-gray-300 active:bg-gray-100',
}

/**
 * 高齢者向けの大きなボタン。
 * 縦48px以上・文字18〜22px・タップしやすい。
 */
export default function Button({
  variant = 'pink',
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={[
        'w-full min-h-[56px] rounded-2xl px-5 py-3',
        'text-[20px] font-bold',
        'shadow-sm transition',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:brightness-100',
        VARIANT_CLASS[variant],
        className,
      ].join(' ')}
    >
      {children}
    </button>
  )
}
