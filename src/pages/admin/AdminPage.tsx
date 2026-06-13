import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Common/Header'
import Button from '../../components/Common/Button'
import { getAdminConfig } from '../../services/firebase'
import AdminSetup from './AdminSetup'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

type Phase = 'loading' | 'error' | 'setup' | 'login' | 'dashboard'

/**
 * 管理者画面のエントリ。
 * Firebase に管理者パスワードが無ければ初回設定、あればログイン、
 * 認証後に本日の予約一覧（ダッシュボード）を表示する。
 */
export default function AdminPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('loading')

  async function detect() {
    setPhase('loading')
    try {
      const cfg = await getAdminConfig()
      setPhase(cfg ? 'login' : 'setup')
    } catch (e) {
      console.error(e)
      setPhase('error')
    }
  }

  useEffect(() => {
    void detect()
  }, [])

  const title =
    phase === 'setup'
      ? '管理者 初回設定'
      : phase === 'dashboard'
        ? '管理者画面'
        : '管理者ログイン'

  return (
    <div className="screen">
      <Header
        title={title}
        onBack={
          phase === 'dashboard'
            ? () => setPhase('login')
            : () => navigate('/')
        }
      />

      {phase === 'loading' ? (
        <div className="screen-body">
          <p className="mt-10 text-center text-[18px] text-brand-sub">
            読み込み中…
          </p>
        </div>
      ) : phase === 'error' ? (
        <div className="screen-body flex flex-col">
          <p className="mt-10 text-center text-[18px] text-brand-sub">
            通信に失敗しました。
          </p>
          <div className="mt-6">
            <Button onClick={() => void detect()}>もう一度</Button>
          </div>
        </div>
      ) : phase === 'setup' ? (
        <AdminSetup onDone={() => setPhase('dashboard')} />
      ) : phase === 'login' ? (
        <AdminLogin onSuccess={() => setPhase('dashboard')} />
      ) : (
        <AdminDashboard />
      )}
    </div>
  )
}
