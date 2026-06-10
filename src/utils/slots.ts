import type { Reservation } from '../types'

/** 1枠あたりの定員。超えると「いっぱい」になる。 */
export const SLOT_CAPACITY = 1

/** 予約できる時間スロット（午前・午後）。 */
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

/** "date time" をキーにした予約件数のマップを作る。 */
export function buildCountMap(
  reservations: Reservation[],
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const r of reservations) {
    const key = `${r.date} ${r.time}`
    map[key] = (map[key] ?? 0) + 1
  }
  return map
}

/** 指定スロットが満員か */
export function isSlotFull(
  counts: Record<string, number>,
  date: string,
  time: string,
): boolean {
  return (counts[`${date} ${time}`] ?? 0) >= SLOT_CAPACITY
}

/** その日の全スロットが満員か（日にち選択での判定用） */
export function isDayFull(
  counts: Record<string, number>,
  date: string,
): boolean {
  return TIME_SLOTS.every((t) => isSlotFull(counts, date, t))
}
