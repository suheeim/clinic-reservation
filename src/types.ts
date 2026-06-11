// 会員（members テーブル）
export interface Member {
  /** 会員番号（5桁・キー） */
  id: string
  /** 会員名（例：田中太郎） */
  name: string
  /** 次回予約日（"2026-06-15"）。なければ null */
  nextReservationDate: string | null
  /** 次回予約時刻（"14:00"）。なければ null */
  nextReservationTime: string | null
  /** 受付済みかどうか */
  checkedIn: boolean
  /** 状態："none" | "reserved" など */
  status: string
}

// 予約レコード（reservations/{date}/{HHMM}）
export interface ReservationRecord {
  /** 会員番号（既存：5桁 / 新患：仮番号 99901〜） */
  memberNumber: string
  /** 既存患者 or 新患者 */
  type: 'existing' | 'new'
  /** 新患者のときの予約日（"2026-06-15"） */
  date?: string
}

/** date → (HHMM → 予約レコード) の入れ子マップ */
export type ReservationsByDate = Record<
  string,
  Record<string, ReservationRecord>
>

/** 予約フローの種類 */
export type ReservationMode = 'existing' | 'new'

/** 予約フローの一時データ */
export interface ReservationDraft {
  mode: ReservationMode
  date: string // "2026-06-15"
  time: string // "14:00"
}
