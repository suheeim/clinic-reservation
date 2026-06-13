import { useState } from 'react'
import {
  getAdminConfig,
  updateAdminPassword,
  verifyAdminAnswer,
  verifyAdminPassword,
} from '../../services/firebase'
import {
  errorBoxCls,
  grayBtnCls,
  inputCls,
  labelCls,
  noticeBoxCls,
  primaryBtnCls,
} from './adminUi'

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
    <div role="alert" className={errorBoxCls}>
      <span aria-hidden="true">⚠</span>
      <span>{error}</span>
    </div>
  ) : null

  if (mode === 'forgot') {
    return (
      <div>
        <div>
          <p className="text-[13px] font-bold text-brand-text">秘密の質問</p>
          <p className="mt-1.5 rounded-lg bg-gray-50 px-3 py-2.5 text-[15px] text-brand-text">
            {question}
          </p>
        </div>
        <div className="mt-4">
          <label className={labelCls} htmlFor="admin-answer">
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
            className={inputCls}
          />
        </div>
        {alertBox}
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={handleCheckAnswer}
            disabled={busy || !answer.trim()}
            className={primaryBtnCls}
          >
            {busy ? '確認中…' : '答え合わせ'}
          </button>
          <button onClick={backToLogin} disabled={busy} className={grayBtnCls}>
            ログインに戻る
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'reset') {
    return (
      <div>
        <p className="text-[14px] text-brand-sub">
          新しいパスワードを設定してください。
        </p>
        <div className="mt-5">
          <label className={labelCls} htmlFor="admin-new-pw">
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
            className={inputCls}
          />
        </div>
        <div className="mt-4">
          <label className={labelCls} htmlFor="admin-new-pw2">
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
            className={inputCls}
          />
        </div>
        {alertBox}
        <div className="mt-6 flex flex-col gap-3">
          <button onClick={handleReset} disabled={busy} className={primaryBtnCls}>
            {busy ? '保存中…' : 'パスワードを再設定'}
          </button>
          <button onClick={backToLogin} disabled={busy} className={grayBtnCls}>
            ログインに戻る
          </button>
        </div>
      </div>
    )
  }

  // mode === 'login'
  return (
    <div>
      {notice ? <div className={noticeBoxCls}>{notice}</div> : null}

      <div>
        <label className={labelCls} htmlFor="admin-login-pw">
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
          className={inputCls}
        />
      </div>

      {alertBox}

      <div className="mt-4">
        <button
          onClick={startForgot}
          disabled={busy}
          className="text-[14px] text-brand-sub underline"
        >
          パスワードを忘れた
        </button>
      </div>

      <button
        onClick={handleLogin}
        disabled={busy || !password}
        className={`${primaryBtnCls} mt-6`}
      >
        {busy ? '確認中…' : 'ログイン'}
      </button>
    </div>
  )
}
