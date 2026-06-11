import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import StepBar from '../../components/Common/StepBar'
import Button from '../../components/Common/Button'
import { QRCodeCanvas } from 'qrcode.react'
import { useSession } from '../../context/SessionContext'
import { formatDateJa, formatTimeJa } from '../../utils/date'

export default function Complete() {
  const navigate = useNavigate()
  const location = useLocation()
  const { draft, setDraft } = useSession()

  // マウント時に draft をスナップショットして保持する。
  // こうすると「ホームへ」押下で context の draft を null にしても
  // この画面の描画はスナップショットを見るため、ガードの
  // <Navigate to="/"> が発火して遷移先を上書きすることがない。
  const [snapshot] = useState(draft)

  const provisionalNumber = (location.state as { provisionalNumber?: string })
    ?.provisionalNumber

  if (!snapshot || !snapshot.date || !snapshot.time)
    return <Navigate to="/" replace />

  const isNew = snapshot.mode === 'new'
  const { date, time } = snapshot

  function finish(to: string) {
    // 先に遷移してから draft を消す。こうすると Complete が
    // アンマウントされた後に draft が null になるため、描画中の
    // ガード（<Navigate to="/">）が発火して遷移先（/home）を
    // ログイン画面に上書きすることがない。
    navigate(to, { replace: true })
    setDraft(null)
  }

  return (
    <div className="screen">
      <header className="bg-brand-green px-4 py-3 text-center text-[20px] font-bold text-white shadow-md">
        予約完了
      </header>
      <StepBar current={5} />

      <div className="screen-body flex flex-col">
        <div className="mt-4 flex flex-col items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-green text-[56px] text-white">
            ✓
          </div>
          <p className="mt-4 text-[28px] font-bold text-brand-green">
            予約しました
          </p>
        </div>

        <dl className="mt-6 rounded-2xl border-2 border-brand-green bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between py-1.5">
            <dt className="text-[17px] text-brand-sub">日付</dt>
            <dd className="text-[20px] font-bold">{formatDateJa(date)}</dd>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <dt className="text-[17px] text-brand-sub">時刻</dt>
            <dd className="text-[20px] font-bold">{formatTimeJa(time)}</dd>
          </div>
        </dl>

        {isNew && provisionalNumber ? (
          <div className="mt-6 rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="text-[17px] font-bold text-brand-text">
              来院時に受付で
              <br />
              このQRコードを見せてください
            </p>
            <div className="mt-4 flex justify-center">
              <QRCodeCanvas value={provisionalNumber} size={200} level="M" />
            </div>
          </div>
        ) : null}

        <div className="mt-auto pb-2 pt-8">
          {isNew ? (
            <p className="rounded-2xl border-2 border-brand-green bg-white p-5 text-center text-[18px] font-bold leading-relaxed text-brand-text shadow-sm">
              この画面のスクリーンショットを撮るか、
              <br />
              画面を開いたまま来院してください。
            </p>
          ) : (
            <Button variant="green" onClick={() => finish('/home')}>
              ホームへ
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
