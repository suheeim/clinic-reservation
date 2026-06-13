import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Common/Button'
import QRModal from '../components/QRModal'
import { useSession } from '../context/SessionContext'
import { formatReservationJa } from '../utils/date'

export default function HomePage() {
  const navigate = useNavigate()
  const { member, logout, setDraft, loadReservations } = useSession()
  const [showQR, setShowQR] = useState(false)
  const [askChange, setAskChange] = useState(false)

  if (!member) return null // ルーティング側でガード済み

  const hasReservation = Boolean(member.nextReservationDate)

  async function goToReservation() {
    setAskChange(false)
    setDraft({ mode: 'existing', date: '', time: '', weekOffset: 0 })
    await loadReservations()
    navigate('/reserve/date')
  }

  function onReserve() {
    if (hasReservation) {
      setAskChange(true)
    } else {
      void goToReservation()
    }
  }

  return (
    <div className="screen">
      <header className="sticky top-0 z-10 bg-brand-pink px-4 py-3 text-white shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-bold">ホーム</h1>
          <button
            onClick={() => setShowQR(true)}
            aria-label="会員QRコードを表示"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-[24px] active:bg-white/30"
          >
            <span aria-hidden="true">▣</span>
          </button>
        </div>
      </header>

      <div className="screen-body">
        <p className="mt-2 text-[26px] font-bold">{member.name} 様</p>

        {hasReservation ? (
          <div className="mt-5 rounded-2xl border-2 border-brand-green bg-white p-4 shadow-sm">
            <p className="text-[16px] font-bold text-brand-green">次回のご予約</p>
            <p className="mt-2 text-[22px] font-bold">
              {formatReservationJa(
                member.nextReservationDate,
                member.nextReservationTime,
              )}
            </p>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-4 text-center">
            <p className="text-[17px] text-brand-sub">ご予約はありません</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4">
          <Button variant="pink" onClick={onReserve}>
            予約する
          </Button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="min-h-[44px] text-[16px] text-brand-sub underline"
          >
            ログアウト
          </button>
        </div>
      </div>

      {/* 予約変更の確認 */}
      {askChange ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-6"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[340px] rounded-3xl bg-white p-6 text-center shadow-xl">
            <p className="text-[20px] font-bold">すでに予約があります</p>
            <p className="mt-3 text-[17px] text-brand-sub">
              予約を変更しますか？
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button variant="pink" onClick={goToReservation}>
                変更する
              </Button>
              <Button variant="gray" onClick={() => setAskChange(false)}>
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showQR ? (
        <QRModal memberNumber={member.id} onClose={() => setShowQR(false)} />
      ) : null}
    </div>
  )
}
