import Header from './Common/Header'
import Button from './Common/Button'
import type { Member } from '../types'
import { formatReservationJa } from '../utils/date'

interface HomePageProps {
  member: Member
  /** 待ち人数（ステップ2以降で実データに差し替え予定） */
  waitingCount?: number
  /** 目安の待ち時間（分） */
  waitingMinutes?: number
  onReserveLater: () => void
  onLogout: () => void
}

export default function HomePage({
  member,
  waitingCount = 0,
  waitingMinutes = 0,
  onReserveLater,
  onLogout,
}: HomePageProps) {
  const hasReservation = !!member.nextReservationDate

  // 当日予約はステップ2で実装予定。今は案内のみ。
  function onTodayPlaceholder() {
    alert('「今日 診てもらう」は次のステップで使えるようになります。')
  }

  return (
    <div className="screen">
      <Header title="ホーム" />

      <div className="screen-body">
        {/* 会員名 */}
        <p className="mt-2 text-[26px] font-bold">{member.name} 様</p>

        {/* 次の予約 */}
        {hasReservation ? (
          <div className="mt-5 rounded-2xl border-2 border-brand-green bg-white p-4 shadow-sm">
            <p className="text-[16px] font-bold text-brand-green">次の予約</p>
            <p className="mt-2 text-[22px] font-bold">
              {formatReservationJa(member.nextReservationDate as string)}
            </p>
            {member.nextReservationPurpose ? (
              <p className="mt-1 text-[17px] text-brand-sub">
                用事：{member.nextReservationPurpose}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-4 text-center">
            <p className="text-[17px] text-brand-sub">予約はありません</p>
          </div>
        )}

        {/* 混雑状況：予約済みのときは非表示 */}
        {!hasReservation ? (
          <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[16px] font-bold text-brand-sub">今の混雑</p>
            <p className="mt-1 text-[20px] font-bold">
              待っている人
              <span className="text-brand-orange">{waitingCount}名</span>
            </p>
            <p className="text-[18px]">
              目安　約
              <span className="font-bold text-brand-orange">
                {waitingMinutes}分
              </span>
            </p>
          </div>
        ) : null}

        {/* メインボタン（縦並び）。予約済みなら「今日 診てもらう」のみ。 */}
        <div className="mt-8 flex flex-col gap-4">
          <Button onClick={onTodayPlaceholder}>今日 診てもらう</Button>
          {!hasReservation ? (
            <Button onClick={onReserveLater}>別の日を予約する</Button>
          ) : null}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onLogout}
            className="min-h-[44px] text-[16px] text-brand-sub underline"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
}
