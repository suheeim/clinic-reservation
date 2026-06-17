import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import Button from '../../components/Common/Button'
import { checkInByMemberNumber } from '../../services/firebase'

/** スキャナーが描画される DOM 要素の id */
const READER_ID = 'checkin-qr-reader'

type Phase = 'idle' | 'scanning' | 'result'

/** 結果表示の種類（受付タブレットの3種＋カメラ起動失敗） */
type ResultKind =
  | 'success'
  | 'no-reservation'
  | 'already-checked-in'
  | 'camera-error'

const RESULT_TEXT: Record<ResultKind, string> = {
  success: '受付しました',
  'no-reservation': '本日のご予約が確認できません',
  'already-checked-in': 'すでに受付済みです',
  'camera-error': 'カメラを起動できません',
}

/**
 * 受付タブレット用のQRチェックイン画面（ログイン不要）。
 * idle → scanning → result の3状態。結果は3秒後に idle へ自動で戻る。
 */
export default function CheckInPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<ResultKind | null>(null)

  // Html5Qrcode インスタンスと二重スキャン防止フラグ
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const processingRef = useRef(false)

  // カメラを確実に停止する（停止していない・未起動でも例外を握りつぶす）
  async function stopScanner() {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (!scanner) return
    try {
      await scanner.stop()
    } catch {
      // 既に停止済みなどは無視
    }
    try {
      scanner.clear()
    } catch {
      // 無視
    }
  }

  // QR読み取り成功時：一旦スキャンを止めてチェックインを実行する
  async function handleDecoded(decoded: string) {
    if (processingRef.current) return
    processingRef.current = true
    await stopScanner()

    const memberNumber = decoded.trim()
    const res = await checkInByMemberNumber(memberNumber)
    setResult(res.ok ? 'success' : res.reason)
    setPhase('result')
  }

  // scanning 状態の間だけカメラを起動し、抜けるとき／アンマウント時に停止する
  useEffect(() => {
    if (phase !== 'scanning') return

    processingRef.current = false
    const scanner = new Html5Qrcode(READER_ID)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          void handleDecoded(decodedText)
        },
        undefined, // フレーム毎の読み取り失敗は無視
      )
      .catch(() => {
        // HTTPS/localhost 以外や権限拒否でカメラが起動できない場合
        scannerRef.current = null
        setResult('camera-error')
        setPhase('result')
      })

    return () => {
      void stopScanner()
    }
  }, [phase])

  // 結果表示は3秒後に待機（idle）へ自動で戻す
  useEffect(() => {
    if (phase !== 'result') return
    const timer = setTimeout(() => {
      setResult(null)
      setPhase('idle')
    }, 3000)
    return () => clearTimeout(timer)
  }, [phase])

  return (
    <div className="screen">
      <header className="bg-brand-green px-4 py-3 text-center text-[20px] font-bold text-white shadow-md">
        受付
      </header>

      <div className="screen-body flex flex-col">
        {phase === 'idle' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-8">
            <p className="text-center text-[20px] font-bold leading-relaxed text-brand-text">
              QRコードを読み取って
              <br />
              受付してください
            </p>
            <div className="w-full">
              <Button variant="green" onClick={() => setPhase('scanning')}>
                受付する
              </Button>
            </div>
          </div>
        )}

        {phase === 'scanning' && (
          <div className="flex flex-1 flex-col">
            <p className="mb-4 text-center text-[18px] font-bold text-brand-text">
              QRコードをカメラに向けてください
            </p>
            <div
              id={READER_ID}
              className="mx-auto w-full max-w-[320px] overflow-hidden rounded-2xl bg-black"
            />
            <div className="mt-auto pt-8">
              <Button variant="gray" onClick={() => setPhase('idle')}>
                戻る
              </Button>
            </div>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div
              className={[
                'flex h-24 w-24 items-center justify-center rounded-full text-[56px] text-white',
                result === 'success' ? 'bg-brand-green' : 'bg-brand-orange',
              ].join(' ')}
            >
              {result === 'success' ? '✓' : '!'}
            </div>
            <p
              className={[
                'text-center text-[26px] font-bold',
                result === 'success' ? 'text-brand-green' : 'text-brand-orange',
              ].join(' ')}
            >
              {RESULT_TEXT[result]}
            </p>
            <p className="text-[16px] text-brand-sub">まもなく待機画面に戻ります</p>
          </div>
        )}
      </div>
    </div>
  )
}
