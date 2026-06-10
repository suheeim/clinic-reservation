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

ログインに使える会員番号（テスト用）：

| 会員番号 | 名前 | 次回予約 |
|---|---|---|
| `00001` | 田中太郎 | あり |
| `00002` | 佐藤花子 | なし |
| `12345` | 山田一郎 | なし |

### データベースルール

`database.rules.json`（開発中のテストモード）。デプロイは：

```bash
firebase deploy --only database     # ルール
firebase deploy --only hosting      # ビルド済み dist/ を公開
```

### 画面遷移（ステップ1）

`ログイン` → `ホーム` → `日にち選択(1/4)` → `時間選択(2/4)` → `確認(3/4)` → `完了`

予約データは `reservations` に保存され、会員の `nextReservationDate` を更新します。
（当日受付・チェックイン・待合室表示・管理画面はステップ2以降）

## ライセンス

MIT
