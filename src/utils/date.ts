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

/** 別々の日付・時刻から「6月15日（金） 14時00分」を作る */
export function formatReservationJa(
  date: string | null,
  time: string | null,
): string {
  if (!date) return ''
  const datePart = formatDateJa(date)
  return time ? `${datePart} ${formatTimeJa(time)}` : datePart
}

/** 今日を含む n 日分の日付キー（"2026-06-15"）の配列 */
export function nextDays(n: number): string[] {
  const base = today()
  return Array.from({ length: n }, (_, i) => toDateKey(addDays(base, i)))
}

/**
 * 今日から weekOffset 週ずらした7日分の日付キー。
 * weekOffset=0 は今日から、1 は来週（7日後から）の7日間。
 * 今日を起点にするので過去日は含まれない。
 */
export function weekDays(weekOffset: number): string[] {
  const start = addDays(today(), weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i)))
}

/** 日曜は休診とする簡易ルール。今後 Firebase の休診設定に置き換え可能。 */
export function isClosed(d: Date): boolean {
  return d.getDay() === 0
}
