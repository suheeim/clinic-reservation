import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, set, update, remove } from 'firebase/database'
import type { Member, ReservationRecord, ReservationsByDate } from '../types'
import { hashPassword, verifyPassword } from '../utils/password'
import { timeKey } from '../utils/slots'

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
