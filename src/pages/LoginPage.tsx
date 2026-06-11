import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Common/Header'
import Button from '../components/Common/Button'
import { loginMember } from '../services/firebase'
import { useSession } from '../context/SessionContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setMember } = useSession()

  const [memberId, setMemberId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = /^\d{5}$/.test(memberId) && password.length > 0

  async function handleLogin() {
    if (!isValid || loading) return
    setError('')
    setLoading(true)
    try {
      const result = await loginMember(memberId, password)
      if (!result.ok) {
        if (result.reason === 'not-found') setError('会員番号が見つかりません')
        else if (result.reason === 'no-password')
          setError('まだ会員登録が済んでいません')
        else setError('パスワードが違います')
        return
      }
      setMember(result.member)
      navigate('/home')
    } catch (e) {
      console.error(e)
      setError('通信に失敗しました。もう一度お試しください')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <Header title="ログイン" onBack={() => navigate('/')} />

      <div className="screen-body flex flex-col">
        <div className="mt-4">
          <label className="text-[18px] font-bold" htmlFor="memberId">
            会員番号（5桁）
          </label>
          <input
            id="memberId"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            autoComplete="off"
            value={memberId}
            onChange={(e) => {
              setMemberId(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))
              if (error) setError('')
            }}
            placeholder="00000"
            aria-label="会員番号（5桁の数字）"
            className="mt-2 w-full rounded-2xl border-2 border-gray-300 bg-white px-5 py-4 text-center text-[30px] font-bold tracking-[0.3em] text-brand-text focus:border-brand-pink"
          />
        </div>

        <div className="mt-6">
          <label className="text-[18px] font-bold" htmlFor="password">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
            }}
            placeholder="パスワード"
            className="mt-2 w-full rounded-2xl border-2 border-gray-300 bg-white px-5 py-4 text-[22px] text-brand-text focus:border-brand-pink"
          />
        </div>

        {error ? (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-xl border-2 border-brand-orange bg-orange-50 px-4 py-3 text-[17px] font-bold text-brand-orange"
          >
            <span aria-hidden="true">⚠</span>
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-auto pb-2 pt-8">
          <Button onClick={handleLogin} disabled={!isValid || loading}>
            {loading ? '確認中…' : 'ログイン'}
          </Button>
        </div>
      </div>
    </div>
  )
}
