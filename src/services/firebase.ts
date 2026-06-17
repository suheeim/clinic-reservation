import { initializeApp } from 'firebase/app'
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  onValue,
} from 'firebase/database'
import type {
  AdminConfig,
  AdminReservationRow,
  Member,
  ReservationRecord,
  ReservationsByDate,
  VisitStatus,
} from '../types'
import { hashPassword, verifyPassword } from '../utils/password'
import { timeFromKey, timeKey } from '../utils/slots'
import { nowTime, toDateKey, today } from '../utils/date'

const firebaseConfig = {
  apiKey: 'AIzaSyDrYB5iRSV0TIPyOjVABj5AWTNEDSB_Lb0',
  authDomain: 'clinic-reservation-bb706.firebaseapp.com',
  databaseURL:
    'https://clinic-reservation-bb706-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'clinic-reservation-bb706',
  storageBucket: 'clinic-reservation-bb706.firebasestorage.app',
  messagingSenderId: '333545634239',
  appId: '1:333545634239:web:1e7e125d0dd6d4b0a9c90a',
  measurementId: 'G-030C6T76KL',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

/** members/{id} の生データを Member 型に整える（パスワードは含めない） */
function toMember(id: string, data: Record<string, unknown>): Member {
  return {
    id,
    name: (data.name as string) ?? '',
    nextReservationDate: (data.nextReservationDate as string) ?? null,
    nextReservationTime: (data.nextReservationTime as string) ?? null,
    checkedIn: (data.checkedIn as boolean) ?? false,
    status: (data.status as string) ?? 'none',
  }
}

/** 会員番号から会員データを検索する。見つからなければ null。 */
export async function findMember(memberId: string): Promise<Member | null> {
  const snap = await get(ref(db, `members/${memberId}`))
  if (!snap.exists()) return null
  return toMember(memberId, snap.val())
}

// ── ログイン ──────────────────────────────────────────────

export type LoginResult =
  | { ok: true; member: Member }
  | { ok: false; reason: 'not-found' | 'no-password' | 'wrong-password' }

/** 会員番号＋パスワードで認証する。 */
export async function loginMember(
  memberId: string,
  password: string,
): Promise<LoginResult> {
  const snap = await get(ref(db, `members/${memberId}`))
  if (!snap.exists()) return { ok: false, reason: 'not-found' }
  const data = snap.val()
  const hash: string = data.password ?? ''
  if (!hash) return { ok: false, reason: 'no-password' }
  if (!verifyPassword(password, hash)) {
    return { ok: false, reason: 'wrong-password' }
  }
  return { ok: true, member: toMember(memberId, data) }
}

// ── 会員登録 ──────────────────────────────────────────────

export type RegisterResult =
  | { ok: true }
  | { ok: false; reason: 'already-registered' }

/**
 * 会員登録（患者カードの会員番号でオンライン用の口座を作る）。
 * すでにパスワード登録済みの番号は拒否する。
 * 病院が氏名だけ事前登録している番号は、パスワードを後付けできる。
 */
export async function registerMember(
  memberId: string,
  name: string,
  password: string,
): Promise<RegisterResult> {
  const snap = await get(ref(db, `members/${memberId}`))
  const data = snap.exists() ? snap.val() : null

  if (data && data.password) {
    return { ok: false, reason: 'already-registered' }
  }

  if (data) {
    // 既存レコード（氏名のみ等）にパスワードと氏名を付与
    await update(ref(db, `members/${memberId}`), {
      name,
      password: hashPassword(password),
    })
  } else {
    // 新規レコードを作成
    await set(ref(db, `members/${memberId}`), {
      name,
      password: hashPassword(password),
      nextReservationDate: null,
      nextReservationTime: null,
      checkedIn: false,
      status: 'none',
    })
  }
  return { ok: true }
}

// ── 予約の空き状況 ────────────────────────────────────────

/** すべての予約を date → HHMM → レコード の入れ子で取得する。 */
export async function getAllReservations(): Promise<ReservationsByDate> {
  const snap = await get(ref(db, 'reservations'))
  if (!snap.exists()) return {}
  return snap.val() as ReservationsByDate
}

/** 指定日の予約マップ（HHMM → レコード）を取得する。 */
export async function getReservationsForDate(
  date: string,
): Promise<Record<string, ReservationRecord>> {
  const snap = await get(ref(db, `reservations/${date}`))
  if (!snap.exists()) return {}
  return snap.val() as Record<string, ReservationRecord>
}

// ── 予約の保存 ────────────────────────────────────────────

/**
 * 既存患者の予約を保存する。
 * 1) 旧予約があれば枠を解放
 * 2) reservations/{date}/{HHMM} を確保
 * 3) members/{id} の次回予約を更新
 */
export async function saveExistingReservation(
  member: Member,
  date: string,
  time: string,
): Promise<void> {
  // 旧予約の枠を解放（予約変更時）
  if (member.nextReservationDate && member.nextReservationTime) {
    await remove(
      ref(
        db,
        `reservations/${member.nextReservationDate}/${timeKey(
          member.nextReservationTime,
        )}`,
      ),
    )
  }

  const record: ReservationRecord = {
    memberNumber: member.id,
    type: 'existing',
  }
  await set(ref(db, `reservations/${date}/${timeKey(time)}`), record)

  await update(ref(db, `members/${member.id}`), {
    nextReservationDate: date,
    nextReservationTime: time,
    status: 'reserved',
  })
}

const PROVISIONAL_MIN = 99901
const PROVISIONAL_MAX = 99999

/** その日の仮会員番号の最大値 + 1（無ければ 99901）を求める。 */
function nextProvisionalNumber(
  dayReservations: Record<string, ReservationRecord>,
): string {
  let max = PROVISIONAL_MIN - 1
  for (const rec of Object.values(dayReservations)) {
    if (rec.type !== 'new') continue
    const n = Number(rec.memberNumber)
    if (n >= PROVISIONAL_MIN && n <= PROVISIONAL_MAX && n > max) max = n
  }
  return String(max + 1)
}

/**
 * 新患者の仮予約を保存する。
 * 仮会員番号（当日分の最大値+1、最初は 99901）を採番して返す。
 */
export async function saveNewReservation(
  date: string,
  time: string,
): Promise<string> {
  const dayReservations = await getReservationsForDate(date)
  const memberNumber = nextProvisionalNumber(dayReservations)

  const record: ReservationRecord = {
    memberNumber,
    type: 'new',
    date,
  }
  await set(ref(db, `reservations/${date}/${timeKey(time)}`), record)
  return memberNumber
}

// ── 管理者認証 ────────────────────────────────────────────

/**
 * 管理者設定（admin/）を取得する。
 * パスワード未設定（初回）のときは null を返す。
 */
export async function getAdminConfig(): Promise<AdminConfig | null> {
  const snap = await get(ref(db, 'admin'))
  if (!snap.exists()) return null
  const data = snap.val()
  if (!data.passwordHash) return null
  return {
    passwordHash: data.passwordHash,
    securityQuestion: data.securityQuestion ?? '',
    answerHash: data.answerHash ?? '',
  }
}

/**
 * 初回設定：管理者パスワード・秘密の質問・答えを保存する。
 * パスワードと答えは bcrypt でハッシュ化する。
 */
export async function setupAdmin(
  password: string,
  securityQuestion: string,
  answer: string,
): Promise<void> {
  await set(ref(db, 'admin'), {
    passwordHash: hashPassword(password),
    securityQuestion,
    answerHash: hashPassword(answer),
  })
}

/** 管理者パスワードを照合する。 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const cfg = await getAdminConfig()
  return cfg ? verifyPassword(password, cfg.passwordHash) : false
}

/** 秘密の質問の答えを照合する。 */
export async function verifyAdminAnswer(answer: string): Promise<boolean> {
  const cfg = await getAdminConfig()
  return cfg ? verifyPassword(answer, cfg.answerHash) : false
}

/** 管理者パスワードを再設定する（秘密の質問の正解後）。 */
export async function updateAdminPassword(password: string): Promise<void> {
  await update(ref(db, 'admin'), { passwordHash: hashPassword(password) })
}

// ── 管理者：本日の予約一覧 ────────────────────────────────

const VISIT_STATUSES: VisitStatus[] = ['unchecked', 'waiting', 'called', 'done']

/** 予約レコードを会員名つきの一覧行へ整える。 */
function toRow(
  key: string,
  rec: ReservationRecord,
  members: Record<string, { name?: string }>,
): AdminReservationRow {
  const name =
    members[rec.memberNumber]?.name ?? (rec.type === 'new' ? '新患' : '—')
  const checkInAt = rec.checkInAt ?? null
  // 明示的な status を優先。古いレコードはチェックイン有無から補完。
  const status: VisitStatus = VISIT_STATUSES.includes(rec.status as VisitStatus)
    ? (rec.status as VisitStatus)
    : checkInAt
      ? 'waiting'
      : 'unchecked'
  return {
    timeKey: key,
    time: timeFromKey(key),
    memberNumber: rec.memberNumber,
    name,
    checkInAt,
    status,
  }
}

/**
 * 本日の予約をリアルタイム購読する（会員名を補完・予約時間順）。
 * 予約や状態が変わるたび onData が呼ばれる。戻り値で購読解除する。
 */
export function subscribeTodayReservations(
  onData: (rows: AdminReservationRow[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const date = toDateKey(today())
  let unsubscribe = () => {}
  let cancelled = false

  // 会員名は一度だけ取得し、予約は onValue でリアルタイムに反映する。
  get(ref(db, 'members'))
    .then((memSnap) => {
      if (cancelled) return
      const members: Record<string, { name?: string }> = memSnap.exists()
        ? memSnap.val()
        : {}
      unsubscribe = onValue(
        ref(db, `reservations/${date}`),
        (snap) => {
          const day = (snap.exists() ? snap.val() : {}) as Record<
            string,
            ReservationRecord
          >
          const rows = Object.entries(day).map(([key, rec]) =>
            toRow(key, rec, members),
          )
          rows.sort((a, b) => a.timeKey.localeCompare(b.timeKey))
          onData(rows)
        },
        (e) => onError?.(e as Error),
      )
    })
    .catch((e) => onError?.(e as Error))

  return () => {
    cancelled = true
    unsubscribe()
  }
}

/**
 * 本日の予約1件の状態を更新する。
 * - "unchecked" にするとチェックイン時刻も消す（未チェックインへ戻す）。
 * - チェックイン済みの状態へ変えるとき、時刻が無ければ現在時刻を記録する
 *   （バッジ操作での手動チェックインを兼ねる）。
 */
export async function setVisitStatus(
  reservationTimeKey: string,
  status: VisitStatus,
): Promise<void> {
  const date = toDateKey(today())
  const path = `reservations/${date}/${reservationTimeKey}`

  if (status === 'unchecked') {
    await update(ref(db, path), { status, checkInAt: null })
    return
  }

  const snap = await get(ref(db, `${path}/checkInAt`))
  const patch: Record<string, unknown> = { status }
  if (!snap.exists() || !snap.val()) patch.checkInAt = nowTime()
  await update(ref(db, path), patch)
}

// ── 受付（チェックイン） ──────────────────────────────────

/**
 * 本日の予約から会員番号で予約キー（HHMM）を逆引きする。
 * 見つからなければ null。
 * 同一会員番号の本日予約は1件の前提（最初の一致を返す）。
 */
export async function findTodayReservationKey(
  memberNumber: string,
): Promise<string | null> {
  const date = toDateKey(today())
  const day = await getReservationsForDate(date)
  for (const [key, rec] of Object.entries(day)) {
    if (rec.memberNumber === memberNumber) return key
  }
  return null
}

export type CheckInResult =
  | { ok: true }
  | { ok: false; reason: 'no-reservation' | 'already-checked-in' }

/**
 * 会員番号で受付（チェックイン）する。
 * 本日の予約を逆引きし、見つかれば status を 'waiting' に更新する。
 * すでに受付済み（unchecked 以外）なら、その旨を返す。
 * 本会員・仮会員は区別しない。
 */
export async function checkInByMemberNumber(
  memberNumber: string,
): Promise<CheckInResult> {
  const key = await findTodayReservationKey(memberNumber)
  if (!key) return { ok: false, reason: 'no-reservation' }

  const date = toDateKey(today())
  const snap = await get(ref(db, `reservations/${date}/${key}`))
  const rec = snap.val() as ReservationRecord

  if (rec.status && rec.status !== 'unchecked') {
    return { ok: false, reason: 'already-checked-in' }
  }

  await setVisitStatus(key, 'waiting')
  return { ok: true }
}
