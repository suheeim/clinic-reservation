/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // △△医院 ブランドカラー
        brand: {
          pink: '#E85C7D', // メインカラー：ボタン・ヘッダー・フォーカス
          green: '#4B7D3A', // サブカラー：成功・確認・チェックマーク
          orange: '#E67E3A', // アクセント：連絡・オプション・キャンセル
          cream: '#F5F1E8', // 背景（クリーム系）
          text: '#333333', // メインテキスト
          sub: '#666666', // 補足テキスト
        },
      },
      fontFamily: {
        sans: [
          '"Hiragino Kaku Gothic ProN"',
          '"Hiragino Sans"',
          'Meiryo',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
