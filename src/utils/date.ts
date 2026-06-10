// 日付まわりのヘルパー。やさしい日本語表示のため。

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

/** Date を "2026-06-15" に変換 */
export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** "2026-06-15" を Date に変換（ローカル時間） */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 今日の0時0分の Date */
export function today(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** n日後の Date */
export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** 曜日の文字（日〜土） */
export function weekdayLabel(d: Date): string {
  return WEEKDAYS[d.getDay()]
}

/** "6月15日（金）" 形式 */
export function formatDateJa(key: string): string {
  const d = fromDateKey(key)
  return `${d.getMonth() + 1}月${d.getDate()}日（${weekdayLabel(d)}）`
}

/** "14時00分" 形式（"14:00" を受け取る） */
export function formatTimeJa(time: string): string {
  const [h, m] = time.split(':')
  return `${Number(h)}時${m}分`
}

/** "2026-06-15 14:00" を「6月15日（金） 14時00分」に */
export function formatReservationJa(value: string): string {
  const [date, time] = value.split(' ')
  if (!date) return value
  const datePart = formatDateJa(date)
  return time ? `${datePart} ${formatTimeJa(time)}` : datePart
}

/** 日曜は休診とする簡易ルール。今後 Firebase の休診設定に置き換え可能。 */
export function isClosed(d: Date): boolean {
  return d.getDay() === 0
}
