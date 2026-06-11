import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  Member,
  ReservationDraft,
  ReservationsByDate,
} from '../types'
import { getAllReservations } from '../services/firebase'

interface SessionValue {
  /** ログイン中の会員（未ログインは null） */
  member: Member | null
  setMember: (m: Member | null) => void
  logout: () => void

  /** 予約フローの一時データ（未開始は null） */
  draft: ReservationDraft | null
  setDraft: (d: ReservationDraft | null) => void
  updateDraft: (patch: Partial<ReservationDraft>) => void

  /** 空き状況（date → HHMM → レコード） */
  reservations: ReservationsByDate
  loadReservations: () => Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null)
  const [draft, setDraft] = useState<ReservationDraft | null>(null)
  const [reservations, setReservations] = useState<ReservationsByDate>({})

  const logout = useCallback(() => {
    setMember(null)
    setDraft(null)
  }, [])

  const updateDraft = useCallback((patch: Partial<ReservationDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  }, [])

  const loadReservations = useCallback(async () => {
    try {
      setReservations(await getAllReservations())
    } catch (e) {
      console.error('空き状況の取得に失敗', e)
      setReservations({})
    }
  }, [])

  const value = useMemo<SessionValue>(
    () => ({
      member,
      setMember,
      logout,
      draft,
      setDraft,
      updateDraft,
      reservations,
      loadReservations,
    }),
    [member, logout, draft, updateDraft, reservations, loadReservations],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
