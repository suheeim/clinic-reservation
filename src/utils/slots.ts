import type { ReservationsByDate } from '../types'
import { isToday, nowTime } from './date'

/** 予約できる時間スロット（午前・午後）。"HH:MM" 形式。 */
export const TIME_SLOTS: string[] = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
]

/** "14:00" → "1400"（Firebase のキー用） */
export function timeKey(time: string): string {
  return time.replace(':', '')
}

/** 指定スロットが予約済みか（定員1） */
export function isSlotTaken(
  reservations: ReservationsByDate,
  date: string,
  time: string,
): boolean {
  return Boolean(reservations[date]?.[timeKey(time)])
}

/**
 * そのスロットが現在時刻より過去か。
 * 今日の予約のときだけ判定し、現在時刻以前のスロットを過去とみなす
 * （"HH:MM" はゼロ埋めなので文字列比較で正しく順序づく）。
 */
export function isPastSlot(date: string, time: string): boolean {
  return isToday(date) && time <= nowTime()
}

/** その日の全スロットが埋まっているか（日にち選択での判定用） */
export function isDayFull(
  reservations: ReservationsByDate,
  date: string,
): boolean {
  return TIME_SLOTS.every((t) => isSlotTaken(reservations, date, t))
}
