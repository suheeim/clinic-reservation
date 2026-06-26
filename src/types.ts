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

/** 診察状態（管理者画面の4段階） */
export type VisitStatus = 'unchecked' | 'waiting' | 'called' | 'done'

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

// ── 運用設定（admin/settings/・容量ベース予約モデル） ──
// 認証用の AdminConfig とは別物。段階2以降もこの下に項目を足していく。

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

/** 曜日ごとの「定休日 ＋ 先生人数」。closed:true のとき am/pm は無視する */
export interface WeekdaySetting {
  closed: boolean
  am: number // 午前の先生人数
  pm: number // 午後の先生人数
}

/** 営業時間（"09:00" 形式） */
export interface BusinessHours {
  start: string
  end: string
}

/** 特定休診日（開始日〜終了日の期間。1日だけのときは start と end が同じ） */
export interface ClosedPeriod {
  start: string // "2026-12-29"
  end: string // "2027-01-03"
  label?: string // 任意。「年末年始」など。空/未設定可
}

/** 短縮営業（その日だけ営業時間が違う）。am/pm が null の時間帯は休み（ー〜ー） */
export interface ShortenedDay {
  date: string // "2026-07-20"
  am: BusinessHours | null
  pm: BusinessHours | null
}

/** 先生人数の臨時変更（1日だけ人数が違う）。am/pm は午前・午後の先生人数（0可） */
export interface DoctorOverride {
  date: string // "2026-07-20"
  am: number // 午前の先生人数（0可）
  pm: number // 午後の先生人数（0可）
}

/** クリニックの運用設定（admin/settings） */
export interface ClinicSettings {
  bandMinutes: number // 枠の基準時間（容量計算の基準・分）
  slotUnit: number // 枠の単位（刻み・分）
  treatmentOptions: number[] // 提供する施術時間（分）
  weekdays: Record<WeekdayKey, WeekdaySetting>
  hours: {
    weekday: { am: BusinessHours; pm: BusinessHours } // 平日（月〜金）
    saturday: { am: BusinessHours; pm: BusinessHours } // 土曜
  }
  holidayAutoClose: boolean // 日本の祝日を自動で休診にするか（初期値 true）
  closedPeriods: ClosedPeriod[] // 特定休診日（年末年始・お盆など）
  temporaryClosedDays: string[] // 臨時休診（1日だけの急な休み）
  shortenedDays: ShortenedDay[] // 短縮営業（その日だけ時間が違う）
  doctorOverrides: DoctorOverride[] // 先生人数の臨時変更（1日だけ人数が違う）
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
  /** 状態（未チェックイン / 待ち / 呼び済み / 完了） */
  status: VisitStatus
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
