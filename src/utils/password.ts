import bcrypt from 'bcryptjs'

// ブラウザ側でパスワードをハッシュ化して RTDB に保存する。
// ステップ1の簡易認証用。bcrypt は自動でソルトを含むハッシュを生成する。

const SALT_ROUNDS = 10

/** 平文パスワードをハッシュ化する */
export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, SALT_ROUNDS)
}

/** 平文と保存済みハッシュを照合する */
export function verifyPassword(plain: string, hash: string): boolean {
  if (!hash) return false
  try {
    return bcrypt.compareSync(plain, hash)
  } catch {
    return false
  }
}
