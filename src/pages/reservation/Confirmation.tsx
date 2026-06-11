import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Header from '../../components/Common/Header'
import StepBar from '../../components/Common/StepBar'
import Button from '../../components/Common/Button'
import { useSession } from '../../context/SessionContext'
import { formatDateJa, formatTimeJa } from '../../utils/date'
import {
  findMember,
  saveExistingReservation,
  saveNewReservation,
} from '../../services/firebase'

export default function Confirmation() {
  const navigate = useNavigate()
  const { draft, member, setMember } = useSession()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!draft || !draft.date || !draft.time)
    return <Navigate to="/reserve/date" replace />

  async function handleConfirm() {
    if (saving || !draft) return
    setSaving(true)
    setError('')
    try {
      if (draft.mode === 'existing') {
        if (!member) {
          navigate('/')
          return
        }
        await saveExistingReservation(member, draft.date, draft.time)
        // ホームに戻ったとき予約が反映されるよう会員データを読み直す
        const refreshed = await findMember(member.id)
        if (refreshed) setMember(refreshed)
        navigate('/reserve/complete', { replace: true })
      } else {
        const provisionalNumber = await saveNewReservation(
          draft.date,
          draft.time,
        )
        navigate('/reserve/complete', {
          replace: true,
          state: { provisionalNumber },
        })
      }
    } catch (e) {
      console.error('予約の保存に失敗', e)
      setError('予約の保存に失敗しました。もう一度お試しください')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <Header title="確認" onBack={() => navigate('/reserve/time')} />
      <StepBar current={3} />

      <div className="screen-body flex flex-col">
        <p className="text-center text-[22px] font-bold">
          この内容で
          <br />
          よろしいですか？
        </p>

        <dl className="mt-6 divide-y divide-gray-200 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between py-3">
            <dt className="text-[17px] text-brand-sub">日付</dt>
            <dd className="text-[20px] font-bold">{formatDateJa(draft.date)}</dd>
          </div>
          <div className="flex items-center justify-between py-3">
            <dt className="text-[17px] text-brand-sub">時刻</dt>
            <dd className="text-[20px] font-bold text-brand-pink">
              {formatTimeJa(draft.time)}
            </dd>
          </div>
        </dl>

        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border-2 border-brand-orange bg-orange-50 px-4 py-3 text-[17px] font-bold text-brand-orange"
          >
            ⚠ {error}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 pb-2 pt-8">
          <Button variant="pink" onClick={handleConfirm} disabled={saving}>
            {saving ? '予約中…' : '確定する'}
          </Button>
          <Button
            variant="gray"
            onClick={() => navigate('/reserve/time')}
            disabled={saving}
          >
            戻る
          </Button>
        </div>
      </div>
    </div>
  )
}
