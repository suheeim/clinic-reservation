import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../components/Common/Header'
import { getAdminConfig } from '../../services/firebase'
import AdminSetup from './AdminSetup'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'
import AdminSettings from './AdminSettings'
import { primaryBtnCls } from './adminUi'

type Phase =
  | 'loading'
  | 'error'
  | 'setup'
  | 'login'
  | 'dashboard'
  | 'settings'

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
        : phase === 'settings'
          ? '基本設定'
          : '管理者ログイン'

  // 管理者画面は病院の PC で操作するため、全幅レイアウトにする。
  // ダッシュボード・設定は広い領域、認証系は中央の適度な幅のカードで表示する。
  return (
    <div className="flex min-h-screen w-full flex-col bg-brand-cream">
      <Header
        title={title}
        onBack={
          phase === 'dashboard'
            ? () => setPhase('login')
            : phase === 'settings'
              ? () => setPhase('dashboard')
              : () => navigate('/')
        }
      />

      {phase === 'dashboard' ? (
        <AdminDashboard onOpenSettings={() => setPhase('settings')} />
      ) : phase === 'settings' ? (
        <AdminSettings />
      ) : (
        <div className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="w-full max-w-[400px] rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            {phase === 'loading' ? (
              <p className="py-6 text-center text-[15px] text-brand-sub">
                読み込み中…
              </p>
            ) : phase === 'error' ? (
              <div className="flex flex-col gap-4 py-2">
                <p className="text-center text-[15px] text-brand-sub">
                  通信に失敗しました。
                </p>
                <button onClick={() => void detect()} className={primaryBtnCls}>
                  もう一度
                </button>
              </div>
            ) : phase === 'setup' ? (
              <AdminSetup onDone={() => setPhase('dashboard')} />
            ) : (
              <AdminLogin onSuccess={() => setPhase('dashboard')} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
