import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import TopPage from './pages/TopPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import DateSelection from './pages/reservation/DateSelection'
import TimeSelection from './pages/reservation/TimeSelection'
import Confirmation from './pages/reservation/Confirmation'
import Complete from './pages/reservation/Complete'
import { useSession } from './context/SessionContext'

/** ログイン必須の画面を保護する。未ログインはトップへ。 */
function RequireMember({ children }: { children: ReactNode }) {
  const { member } = useSession()
  if (!member) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
