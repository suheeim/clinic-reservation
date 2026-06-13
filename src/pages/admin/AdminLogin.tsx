import { useState } from 'react'
import Button from '../../components/Common/Button'
import {
  getAdminConfig,
  updateAdminPassword,
  verifyAdminAnswer,
  verifyAdminPassword,
} from '../../services/firebase'

interface Props {
  /** ログイン成功時に呼ばれる（ダッシュボードへ） */
  onSuccess: () => void
}

type Mode = 'login' | 'forgot' | 'reset'

/** 管理者ログイン。パスワード／秘密の質問での再設定を内包する。 */
export default function AdminLogin({ onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('login')

  // ログイン
  const [password, setPassword] = useState('')
  // 秘密の質問
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  // 再設定
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleLogin() {
    if (busy || !password) return
    setError('')
    setBusy(true)
    try {
      if (await verifyAdminPassword(password)) {
        onSuccess()
      } else {
        setError('パスワードが違います')
      }
    } catch (e) {
      console.error(e)
      setError('通信に失敗しました。もう一度お試しください')
    } finally {
      setBusy(false)
    }
  }

  async function startForgot() {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const cfg = await getAdminConfig()
      if (!cfg) {
        setError('管理者設定が見つかりません')
        return
      }
      setQuestion(cfg.securityQuestion)
      setAnswer('')
      setMode('forgot')
    } catch (e) {
      console.error(e)
      setError('通信に失敗しました。もう一度お試しください')
    } finally {
      setBusy(false)
    }
  }

  async function handleCheckAnswer() {
    if (busy || !answer.trim()) return
    setError('')
    setBusy(true)
    try {
      if (await verifyAdminAnswer(answer.trim())) {
        setNewPassword('')
        setNewPassword2('')
        setMode('reset')
      } else {
        setError('答えが違います')
      }
    } catch (e) {
      console.error(e)
      setError('通信に失敗しました。もう一度お試しください')
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    if (busy) return
    setError('')
    if (newPassword.length < 4) {
      setError('パスワードは4文字以上で入力してください')
      return
    }
    if (newPassword !== newPassword2) {
      setError('確認用パスワードが一致しません')
      return
    }
    setBusy(true)
    try {
      await updateAdminPassword(newPassword)
      // 新しいパスワードでのログインを促す
      setPassword('')
      setMode('login')
      setNotice('パスワードを再設定しました。新しいパスワードでログインしてください')
    } catch (e) {
      console.error(e)
      setError('保存に失敗しました。もう一度お試しください')
    } finally {
      setBusy(false)
    }
  }

  function backToLogin() {
    setError('')
    setNotice('')
    setMode('login')
  }

  const alertBox = error ? (
    <div
      role="alert"
      className="mt-4 flex items-center gap-2 rounded-xl border-2 border-brand-orange bg-orange-50 px-4 py-3 text-[17px] font-bold text-brand-orange"
    >
      <span aria-hidden="true">⚠</span>
      <span>{error}</span>
    </div>
  ) : null

  if (mode === 'forgot') {
    return (
      <div className="screen-body flex flex-col">
        <div className="mt-4">
          <p className="text-[18px] font-bold">秘密の質問</p>
          <p className="mt-2 rounded-2xl bg-white px-5 py-4 text-[20px] text-brand-text shadow-sm">
            {question}
          </p>
        </div>
        <div className="mt-5">
          <label className="text-[18px] font-bold" htmlFor="admin-answer">
            答え
          </label>
          <input
            id="admin-answer"
            type="text"
            autoComplete="off"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value)
              if (error) setError('')
            }}
            placeholder="答えを入力"
            className="mt-2 w-full rounded-2xl border-2 border-gray-300 bg-white px-5 py-4 text-[20px] text-brand-text focus:border-brand-pink"
          />
        </div>
        {alertBox}
        <div className="mt-auto flex flex-col gap-3 pb-2 pt-8">
          <Button onClick={handleCheckAnswer} disabled={busy || !answer.trim()}>
            {busy ? '確認中…' : '答え合わせ'}
          </Button>
          <Button variant="gray" onClick={backToLogin} disabled={busy}>
            ログインに戻る
          </Button>
        </div>
      </div>
    )
  }

  if (mode === 'reset') {
    return (
      <div className="screen-body flex flex-col">
        <p className="mt-2 text-[17px] text-brand-sub">
          新しいパスワードを設定してください。
        </p>
        <div className="mt-5">
          <label className="text-[18px] font-bold" htmlFor="admin-new-pw">
            新しいパスワード
          </label>
          <input
            id="admin-new-pw"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
              if (error) setError('')
            }}
            placeholder="4文字以上"
            className="mt-2 w-full rounded-2xl border-2 border-gray-300 bg-white px-5 py-4 text-[22px] text-brand-text focus:border-brand-pink"
          />
        </div>
        <div className="mt-5">
          <label className="text-[18px] font-bold" htmlFor="admin-new-pw2">
            パスワード（確認）
          </label>
          <input
            id="admin-new-pw2"
            type="password"
            autoComplete="new-password"
            value={newPassword2}
            onChange={(e) => {
              setNewPassword2(e.target.value)
              if (error) setError('')
            }}
            placeholder="もう一度入力"
            className="mt-2 w-full rounded-2xl border-2 border-gray-300 bg-white px-5 py-4 text-[22px] text-brand-text focus:border-brand-pink"
          />
        </div>
        {alertBox}
        <div className="mt-auto flex flex-col gap-3 pb-2 pt-8">
          <Button onClick={handleReset} disabled={busy}>
            {busy ? '保存中…' : 'パスワードを再設定'}
          </Button>
          <Button variant="gray" onClick={backToLogin} disabled={busy}>
            ログインに戻る
          </Button>
        </div>
      </div>
    )
  }

  // mode === 'login'
  return (
    <div className="screen-body flex flex-col">
      {notice ? (
        <div className="mt-4 rounded-xl border-2 border-brand-green bg-green-50 px-4 py-3 text-[16px] font-bold text-brand-green">
          {notice}
        </div>
      ) : null}

      <div className="mt-4">
        <label className="text-[18px] font-bold" htmlFor="admin-login-pw">
          パスワード
        </label>
        <input
          id="admin-login-pw"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleLogin()
          }}
          placeholder="パスワード"
          className="mt-2 w-full rounded-2xl border-2 border-gray-300 bg-white px-5 py-4 text-[22px] text-brand-text focus:border-brand-pink"
        />
      </div>

      {alertBox}

      <div className="mt-6">
        <button
          onClick={startForgot}
          disabled={busy}
          className="min-h-[44px] text-[16px] text-brand-sub underline"
        >
          パスワードを忘れた
        </button>
      </div>

      <div className="mt-auto pb-2 pt-8">
        <Button onClick={handleLogin} disabled={busy || !password}>
          {busy ? '確認中…' : 'ログイン'}
        </Button>
      </div>
    </div>
  )
}
