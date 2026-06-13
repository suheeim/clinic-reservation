import { useState } from 'react'
import { setupAdmin } from '../../services/firebase'
import { errorBoxCls, inputCls, labelCls, primaryBtnCls } from './adminUi'

interface Props {
  /** 設定完了後に呼ばれる（ダッシュボードへ） */
  onDone: () => void
}

/** 初回設定：管理者パスワードと秘密の質問・答えを登録する。 */
export default function AdminSetup({ onDone }: Props) {
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isValid =
    password.length >= 4 &&
    password === password2 &&
    question.trim().length > 0 &&
    answer.trim().length > 0

  async function handleSave() {
    if (saving) return
    setError('')
    if (password.length < 4) {
      setError('パスワードは4文字以上で入力してください')
      return
    }
    if (password !== password2) {
      setError('確認用パスワードが一致しません')
      return
    }
    if (!question.trim() || !answer.trim()) {
      setError('秘密の質問と答えを入力してください')
      return
    }
    setSaving(true)
    try {
      await setupAdmin(password, question.trim(), answer.trim())
      onDone()
    } catch (e) {
      console.error(e)
      setError('保存に失敗しました。もう一度お試しください')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <p className="text-[14px] leading-relaxed text-brand-sub">
        管理者パスワードを設定してください。パスワードを忘れたときは秘密の質問で再設定できます。
      </p>

      <div className="mt-5">
        <label className={labelCls} htmlFor="admin-pw">
          新しいパスワード
        </label>
        <input
          id="admin-pw"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError('')
          }}
          placeholder="4文字以上"
          className={inputCls}
        />
      </div>

      <div className="mt-4">
        <label className={labelCls} htmlFor="admin-pw2">
          パスワード（確認）
        </label>
        <input
          id="admin-pw2"
          type="password"
          autoComplete="new-password"
          value={password2}
          onChange={(e) => {
            setPassword2(e.target.value)
            if (error) setError('')
          }}
          placeholder="もう一度入力"
          className={inputCls}
        />
      </div>

      <div className="mt-4">
        <label className={labelCls} htmlFor="admin-q">
          秘密の質問
        </label>
        <input
          id="admin-q"
          type="text"
          value={question}
          onChange={(e) => {
            setQuestion(e.target.value)
            if (error) setError('')
          }}
          placeholder="例：最初に勤めた病院は？"
          className={inputCls}
        />
      </div>

      <div className="mt-4">
        <label className={labelCls} htmlFor="admin-a">
          答え
        </label>
        <input
          id="admin-a"
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

      {error ? (
        <div role="alert" className={errorBoxCls}>
          <span aria-hidden="true">⚠</span>
          <span>{error}</span>
        </div>
      ) : null}

      <button
        onClick={handleSave}
        disabled={!isValid || saving}
        className={`${primaryBtnCls} mt-6`}
      >
        {saving ? '保存中…' : '設定する'}
      </button>
    </div>
  )
}
