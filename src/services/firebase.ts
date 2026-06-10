import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, push, update } from 'firebase/database'
import { getAuth, signInAnonymously } from 'firebase/auth'
import type { Member, Reservation } from '../types'

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
export const auth = getAuth(app)

/** 匿名認証でサインイン（会員番号照合の前提となるセッション確立） */
export async function ensureAnonymousAuth(): Promise<void> {
  if (auth.currentUser) return
  await signInAnonymously(auth)
}

/**
 * 会員番号から会員データを検索する。
 * 見つからなければ null を返す。
 */
export async function findMember(memberId: string): Promise<Member | null> {
  const snap = await get(ref(db, `members/${memberId}`))
  if (!snap.exists()) return null
  const data = snap.val()
  return {
    id: memberId,
    name: data.name ?? '',
    nextReservationDate: data.nextReservationDate ?? null,
    nextReservationPurpose: data.nextReservationPurpose ?? null,
    checkedIn: data.checkedIn ?? false,
    todayNumber: data.todayNumber ?? null,
    status: data.status ?? 'none',
  }
}

/**
 * すべての予約を取得する（時間ごとの空き状況計算に使う）。
 * ステップ1の規模では全件読み込みで十分。
 */
export async function getAllReservations(): Promise<Reservation[]> {
  const snap = await get(ref(db, 'reservations'))
  if (!snap.exists()) return []
  return Object.values<Reservation>(snap.val())
}

/**
 * 予約を保存する。
 * 1) reservations に追加
 * 2) members/$id の nextReservationDate などを更新
 */
export async function saveReservation(
  member: Member,
  date: string,
  time: string,
  purpose: string,
  createdAt: string,
): Promise<void> {
  const reservation: Reservation = {
    memberId: member.id,
    date,
    time,
    purpose,
    createdAt,
  }
  await push(ref(db, 'reservations'), reservation)

  await update(ref(db, `members/${member.id}`), {
    nextReservationDate: `${date} ${time}`,
    nextReservationPurpose: purpose,
    status: 'reserved',
  })
}
