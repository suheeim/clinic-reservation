import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Common/Header'
import Button from '../components/Common/Button'
import { registerMember } from '../services/firebase'

export default function RegisterPage() {
  const navigate = useNavigate()

  const [memberId, setMemberId] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid =
    /^\d{5}$/.test(memberId) && name.trim().length > 0 && password.length >= 4

  async function handleRegister() {
    if (!isValid || loading) return
    setError('')
    setLoading(true)
    try {
      const result = await registerMember(memberId, name.trim(), password)
      if (!result.ok) {
        setError('この会員番号は既に登録済みです')
        return
      }
      alert('会員登録が完了しました。ログインしてください。')
      navigate('/login')
    } catch (e) {
      console.error(e)
      setError('通信に失敗しました。もう一度お試しください')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <Header title="会員登録" onBack={() => navigate('/')} />

      <div className="screen-body flex flex-col">
        <p className="mt-2 text-[16px] text-brand-sub">
          診察券に記載の会員番号と、お名前・パスワードを入力してください。
        </p>

        <div className="mt-5">
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

        <div className="mt-5">
          <label className="text-[18px] font-bold" htmlFor="name">
            お名前
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            placeholder="山田 太郎"
            className="mt-2 w-full rounded-2xl border-2 border-gray-300 bg-white px-5 py-4 text-[22px] text-brand-text focus:border-brand-pink"
          />
        </div>

        <div className="mt-5">
          <label className="text-[18px] font-bold" htmlFor="password">
            パスワード（4文字以上）
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
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
          <Button variant="green" onClick={handleRegister} disabled={!isValid || loading}>
            {loading ? '登録中…' : '登録する'}
          </Button>
        </div>
      </div>
    </div>
  )
}
