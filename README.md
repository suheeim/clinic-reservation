# clinic-reservation

医療施設向けの予約・受付システム

## 概要

スマホ・タブレット・大画面で予約と受付を一体管理するシステムです。シンプルで使いやすく、余分な機能を排除した設計です。

## 主な機能

- **事前予約** ：日時を指定して予約
- **当日受付** ：来院時の受付と順番管理
- **リアルタイム同期** ：複数端末でデータを共有・更新
- **混雑状況表示** ：待ち人数と目安時間
- **会員管理** ：シンプルなログイン

## 利用環境

- **スマホ** ：予約・受付・状況確認
- **受付タブレット** ：チェックイン
- **待合室の大画面** ：状況表示
- **管理画面** ：スタッフ用

## 技術構成

- React + TypeScript
- Firebase Realtime Database
- Firebase Hosting

## 特徴

✅ シンプルで分かりやすいUI  
✅ 必要最小限のデータ管理  
✅ リアルタイムで複数端末を同期  
✅ 個人情報は最小限  
✅ 直感的な操作設計

## 実装計画

**ステップ1** ：ログイン・ホーム・事前予約

**ステップ2** ：当日受付・チェックイン

**ステップ3** ：待合室表示・管理画面

**ステップ4** ：追加機能（QR・通知など）

## セットアップ

```bash
git clone https://github.com/your-username/clinic-reservation.git
cd clinic-reservation
npm install
npm run dev   # http://localhost:3000  （npm start も同じ）
```

## 開発メモ（ステップ1）

技術構成：**Vite + React + TypeScript + Tailwind CSS + Firebase Realtime Database**

### スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` / `npm start` | 開発サーバー起動（ポート3000） |
| `npm run build` | 型チェック + 本番ビルド（`dist/`） |
| `npm run preview` | ビルド結果のプレビュー |

### Firebase の初期データ投入

`seed-data.json` にテスト用の会員データが入っています。
Firebase コンソール → Realtime Database → 「JSONをインポート」から投入してください。

ログインに使えるテスト用アカウント（パスワードは bcrypt でハッシュ化済み）：

| 会員番号 | 名前 | パスワード | 次回予約 | 用途 |
|---|---|---|---|---|
| `00001` | 田中太郎 | `1234` | あり | ログイン・予約変更の確認 |
| `00002` | 佐藤花子 | `1234` | なし | 新規予約の確認 |
| `12345` | 山田一郎 | （未設定） | なし | 会員登録の確認（氏名のみ事前登録） |

> パスワードはブラウザ側で bcrypt ハッシュ化して `members/{会員番号}/password` に保存・照合します。
> `12345` はパスワード未設定のため、「会員登録」画面でパスワードを設定してからログインできます。

### データベースルール

`database.rules.json`（開発中のテストモード）。デプロイは：

```bash
firebase deploy --only database     # ルール
firebase deploy --only hosting      # ビルド済み dist/ を公開
```

### 画面遷移（ステップ1）

```
トップ ─┬─ ログイン ──────────────→ ホーム ─┬─ 予約する → 日付(1/4) → 時間(2/4) → 確認(3/4) → 完了 → ホーム
        ├─ 会員登録 → ログイン                 ├─ 今日 診てもらう（次ステップ用の案内のみ）
        └─ 初診予約 ───────────────────────────┴─ QRアイコン（会員番号QRをポップアップ）
                  └→ 日付(1/4) → 時間(2/4) → 確認(3/4) → 完了（仮会員番号のQRを表示）
```

- 既存患者：予約データを `reservations/{日付}/{HHMM}` に保存し、会員の `nextReservationDate` / `nextReservationTime` を更新。
  予約済みの状態で「予約する」を押すと変更確認ダイアログを表示し、変更時は旧スロットを解放します。
- 新患者（初診）：当日分の仮会員番号（`99901`〜、最大値+1）を自動採番し、完了画面に会員番号QRを表示します。

ルーティングは `react-router-dom`、QRコード生成は `qrcode.react` を使用しています。
（当日受付・チェックイン・待合室表示・管理画面はステップ2以降）

### データ構造（Firebase Realtime Database）

```
members/{会員番号}        : { name, password(ハッシュ), nextReservationDate, nextReservationTime, checkedIn, status }
reservations/{日付}/{HHMM}: { memberNumber, type: "existing" | "new", date?(新患のみ) }
```

## ライセンス

MIT
