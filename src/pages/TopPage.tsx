import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'

/** トップ画面（未ログイン）。ログインをメインに、会員登録・初診予約は下に小さく。 */
export default function TopPage() {
  const navigate = useNavigate()
  const { setDraft, loadReservations } = useSession()

  async function startFirstVisit() {
    setDraft({ mode: 'new', date: '', time: '' })
    await loadReservations()
    navigate('/reserve/date')
  }

  return (
    <div className="screen">
      <header className="bg-brand-pink px-4 py-6 text-center text-white shadow-md">
        <h1 className="text-[26px] font-bold">△△医院</h1>
        <p className="mt-1 text-[17px]">ネット予約</p>
      </header>

      <div className="screen-body flex flex-col">
        {/* メイン：ログイン（大きく中央） */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <button
            onClick={() => navigate('/login')}
            className="w-full min-h-[88px] rounded-3xl bg-brand-pink text-[28px] font-bold text-white shadow-md transition active:brightness-90"
          >
            ログイン
          </button>
          <p className="mt-3 text-[15px] text-brand-sub">登録がお済みの方</p>
        </div>

        {/* サブ：会員登録・初診予約（小さめ・テキストリンク風） */}
        <div className="mt-auto pb-2 pt-6">
          <div className="flex items-stretch justify-center text-center">
            <button
              onClick={() => navigate('/register')}
              className="flex min-h-[56px] flex-1 flex-col items-center justify-center px-3 py-2 active:opacity-70"
            >
              <span className="text-[18px] font-bold text-brand-green underline">
                会員登録
              </span>
              <span className="mt-0.5 text-[13px] text-brand-sub">
                診察券をお持ちの方
              </span>
            </button>

            <div className="my-1 w-px self-stretch bg-gray-300" aria-hidden="true" />

            <button
              onClick={startFirstVisit}
              className="flex min-h-[56px] flex-1 flex-col items-center justify-center px-3 py-2 active:opacity-70"
            >
              <span className="text-[18px] font-bold text-brand-orange underline">
                初診予約
              </span>
              <span className="mt-0.5 text-[13px] text-brand-sub">
                診察券をお持ちでない方
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
