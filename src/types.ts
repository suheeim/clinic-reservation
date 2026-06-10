// 会員（members テーブル）
export interface Member {
  /** 会員番号（5桁・キー） */
  id: string
  /** 会員名（例：田中太郎） */
  name: string
  /** 次回予約日時（例："2026-06-15 14:00"）。なければ null */
  nextReservationDate: string | null
  /** 用事（例：はりきゅう） */
  nextReservationPurpose?: string | null
  /** 受付済みかどうか */
  checkedIn: boolean
  /** 当日の受付番号 */
  todayNumber: number | null
  /** 状態："none" | "reserved" | "waiting" | "done" など */
  status: string
}

// 予約（reservations テーブル）
export interface Reservation {
  memberId: string
  /** 日付（"2026-06-15"） */
  date: string
  /** 時刻（"14:00"） */
  time: string
  /** 用事 */
  purpose: string
  /** 作成時刻（ISO文字列） */
  createdAt: string
}

// 画面遷移の状態
export type Screen =
  | 'login'
  | 'home'
  | 'date'
  | 'time'
  | 'confirm'
  | 'complete'

// 予約フローの一時データ
export interface DraftReservation {
  date: string // "2026-06-15"
  time: string // "14:00"
  purpose: string
}
