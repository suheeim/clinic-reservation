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

/** 受付後の診察状態（管理者画面の3段階）。未チェックインは未設定 */
export type VisitStatus = 'waiting' | 'called' | 'done'

// 予約レコード（reservations/{date}/{HHMM}）
export interface ReservationRecord {
  /** 会員番号（既存：5桁 / 新患：仮番号 99901〜） */
  memberNumber: string
  /** 既存患者 or 新患者 */
  type: 'existing' | 'new'
  /** 新患者のときの予約日（"2026-06-15"） */
  date?: string
  /** チェックイン時刻（"14:05"）。未チェックインは未設定 */
  checkInAt?: string
  /** 受付後の状態。未チェックインは未設定 */
  status?: VisitStatus
}

// 管理者設定（admin/）。パスワードと秘密の答えは bcrypt ハッシュで保存
export interface AdminConfig {
  /** 管理者パスワードのハッシュ */
  passwordHash: string
  /** 秘密の質問（平文） */
  securityQuestion: string
  /** 秘密の答えのハッシュ */
  answerHash: string
}

/** 管理者画面・本日の予約一覧の1行 */
export interface AdminReservationRow {
  /** Firebase キー（"1400"） */
  timeKey: string
  /** 予約時間（"14:00"） */
  time: string
  /** 会員番号 */
  memberNumber: string
  /** 会員名（新患・不明は補完表示） */
  name: string
  /** チェックイン時刻（"14:05"）。未チェックインは null */
  checkInAt: string | null
  /** 状態。未チェックイン（操作不可）は null */
  status: VisitStatus | null
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
  /** 日付選択で表示中の週（0=今週, 1=来週, …）。画面を行き来しても保持する */
  weekOffset: number
}
