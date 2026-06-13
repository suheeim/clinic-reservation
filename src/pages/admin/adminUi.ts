// 管理者画面（PC 向け）で使う共通のフォーム・ボタンスタイル。
// 病院の PC 操作を想定し、フォント・余白を控えめにする。

export const labelCls = 'block text-[13px] font-bold text-brand-text'

export const inputCls =
  'mt-1.5 w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-[15px] text-brand-text focus:border-brand-pink'

export const primaryBtnCls =
  'w-full rounded-lg bg-brand-pink px-4 py-2.5 text-[15px] font-bold text-white shadow-sm transition active:brightness-90 disabled:opacity-50 disabled:active:brightness-100'

export const grayBtnCls =
  'w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-[15px] font-bold text-brand-text transition active:bg-gray-100 disabled:opacity-50'

export const errorBoxCls =
  'mt-3 flex items-center gap-2 rounded-lg border-2 border-brand-orange bg-orange-50 px-3 py-2 text-[14px] font-bold text-brand-orange'

export const noticeBoxCls =
  'mb-3 rounded-lg border-2 border-brand-green bg-green-50 px-3 py-2 text-[14px] font-bold text-brand-green'
