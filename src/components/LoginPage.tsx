import { useState } from 'react'
import Button from './Common/Button'
import { ensureAnonymousAuth, findMember } from '../services/firebase'
import type { Member } from '../types'

interface LoginPageProps {
  onLogin: (member: Member) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = /^\d{5}$/.test(value)

  async function handleLogin() {
    if (!isValid || loading) return
    setError('')
    setLoading(true)
    try {
      // 匿名認証はベストエフォート（コンソールで無効でもテストモードの
      // ルールでは会員検索が可能なため、ログインはブロックしない）
      try {
        await ensureAnonymousAuth()
      } catch (authErr) {
        console.warn('匿名認証をスキップしました', authErr)
      }
      const member = await findMember(value)
      if (!member) {
        setError('番号が見つかりません')
        return
      }
      onLogin(member)
    } catch (e) {
      console.error(e)
      setError('つうしんに しっぱいしました。もういちど おためしください')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <header className="bg-brand-pink px-4 py-5 text-center text-white shadow-md">
        <h1 className="text-[22px] font-bold">さくら針灸整骨院</h1>
        <p className="mt-1 text-[16px]">ネットよやく</p>
      </header>

      <div className="screen-body flex flex-col">
        <div className="mt-6 text-center">
          <p className="text-[20px] font-bold">会員番号を いれてください</p>
          <p className="mt-3 text-[16px] text-brand-sub">
            しんさつけんに かいてある
            <br />
            5けたの番号です
          </p>
        </div>

        <div className="mt-8">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            autoComplete="off"
            value={value}
            onChange={(e) => {
              // 数字のみ・5桁まで
              const next = e.target.value.replace(/[^0-9]/g, '').slice(0, 5)
              setValue(next)
              if (error) setError('')
            }}
            placeholder="00000"
            aria-label="会員番号（5桁の数字）"
            className="w-full rounded-2xl border-2 border-gray-300 bg-white px-5 py-4 text-center text-[32px] font-bold tracking-[0.4em] text-brand-text focus:border-brand-pink"
          />

          {error ? (
            <div
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-xl border-2 border-brand-orange bg-orange-50 px-4 py-3 text-[17px] font-bold text-brand-orange"
            >
              <span aria-hidden="true">⚠</span>
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-auto pb-2 pt-8">
          <Button onClick={handleLogin} disabled={!isValid || loading}>
            {loading ? 'かくにん中…' : 'ログイン'}
          </Button>
        </div>
      </div>
    </div>
  )
}
