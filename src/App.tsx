import { useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import TopPage from './pages/TopPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import DateSelection from './pages/reservation/DateSelection'
import TimeSelection from './pages/reservation/TimeSelection'
import Confirmation from './pages/reservation/Confirmation'
import Complete from './pages/reservation/Complete'
import AdminPage from './pages/admin/AdminPage'
import { useSession } from './context/SessionContext'

/** ログイン必須の画面を保護する。未ログインはトップへ。 */
function RequireMember({ children }: { children: ReactNode }) {
  const { member } = useSession()
  if (!member) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const navigate = useNavigate()

  // 案内されている "#/admin"（ハッシュ形式）で来た場合に /admin へ橋渡しする。
  // 本アプリは BrowserRouter のため通常パスは /admin。
  useEffect(() => {
    if (window.location.hash.replace(/^#/, '') === '/admin') {
      navigate('/admin', { replace: true })
    }
  }, [navigate])

  return (
    <Routes>
      <Route path="/" element={<TopPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/home"
        element={
          <RequireMember>
            <HomePage />
          </RequireMember>
        }
      />
      <Route path="/reserve/date" element={<DateSelection />} />
      <Route path="/reserve/time" element={<TimeSelection />} />
      <Route path="/reserve/confirm" element={<Confirmation />} />
      <Route path="/reserve/complete" element={<Complete />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
