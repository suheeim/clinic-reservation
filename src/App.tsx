import { useState } from 'react'
import LoginPage from './components/LoginPage'
import HomePage from './components/HomePage'
import DateSelection from './components/ReservationFlow/DateSelection'
import TimeSelection from './components/ReservationFlow/TimeSelection'
import Confirmation from './components/ReservationFlow/Confirmation'
import Complete from './components/ReservationFlow/Complete'
import {
  findMember,
  getAllReservations,
  saveReservation,
} from './services/firebase'
import { buildCountMap } from './utils/slots'
import type { DraftReservation, Member, Screen } from './types'

// ステップ1の用事は固定（用事の選択は次のステップで追加予定）
const DEFAULT_PURPOSE = '診療（治療）'

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [member, setMember] = useState<Member | null>(null)

  // 予約フローの一時データ
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [counts, setCounts] = useState<Record<string, number>>({})

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function handleLogin(m: Member) {
    setMember(m)
    setScreen('home')
  }

  function handleLogout() {
    setMember(null)
    setDate('')
    setTime('')
    setScreen('login')
  }

  // 予約フロー開始：空き状況を読み込んで日にち選択へ
  async function startReservation() {
    try {
      const reservations = await getAllReservations()
      setCounts(buildCountMap(reservations))
    } catch (e) {
      console.error('空き状況の取得に失敗', e)
      setCounts({})
    }
    setDate('')
    setTime('')
    setSaveError('')
    setScreen('date')
  }

  function handleSelectDate(d: string) {
    setDate(d)
    setScreen('time')
  }

  function handleSelectTime(t: string) {
    setTime(t)
    setSaveError('')
    setScreen('confirm')
  }

  // 予約を確定して Firebase に保存
  async function handleConfirm() {
    if (!member || saving) return
    setSaving(true)
    setSaveError('')
    try {
      const createdAt = new Date().toISOString()
      await saveReservation(member, date, time, DEFAULT_PURPOSE, createdAt)
      // ホームに戻ったとき予約が反映されるよう、最新の会員データを読み直す
      const refreshed = await findMember(member.id)
      if (refreshed) setMember(refreshed)
      setScreen('complete')
    } catch (e) {
      console.error('予約の保存に失敗', e)
      setSaveError('予約の保存に失敗しました。もう一度お試しください')
    } finally {
      setSaving(false)
    }
  }

  const draft: DraftReservation = { date, time, purpose: DEFAULT_PURPOSE }

  switch (screen) {
    case 'login':
      return <LoginPage onLogin={handleLogin} />

    case 'home':
      return member ? (
        <HomePage
          member={member}
          onReserveLater={startReservation}
          onLogout={handleLogout}
        />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )

    case 'date':
      return (
        <DateSelection
          counts={counts}
          onBack={() => setScreen('home')}
          onSelect={handleSelectDate}
        />
      )

    case 'time':
      return (
        <TimeSelection
          date={date}
          counts={counts}
          onBack={() => setScreen('date')}
          onSelect={handleSelectTime}
        />
      )

    case 'confirm':
      return (
        <Confirmation
          draft={draft}
          saving={saving}
          error={saveError}
          onBack={() => setScreen('time')}
          onConfirm={handleConfirm}
        />
      )

    case 'complete':
      return <Complete draft={draft} onClose={() => setScreen('home')} />

    default:
      return <LoginPage onLogin={handleLogin} />
  }
}
