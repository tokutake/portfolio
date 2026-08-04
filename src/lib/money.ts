import type { Currency, Holding } from '../types'

// "$14,199.60" や "¥1,234,567" を通貨付き数値に分解
export function parseMoney(s: string): { currency: Currency; amount: number } {
  const currency = s.trim().startsWith('¥') ? 'JPY' : 'USD'
  const amount = Number(s.replace(/[^0-9.-]/g, '')) || 0
  return { currency, amount }
}

// 銘柄の評価額を米ドルに換算（時価総額順ソート用）
export function valueUsd(h: Holding, fxRate: number): number {
  const { currency, amount } = parseMoney(h.value)
  return currency === 'JPY' ? amount / fxRate : amount
}

// 数字・記号以外を取り除く（編集フォームの初期値用）
export function stripSymbol(s: string): string {
  return s.replace(/[^0-9.,-]/g, '')
}

// 通貨記号
export function symbolFor(currency: Currency): string {
  return currency === 'JPY' ? '¥' : '$'
}

// 金額に通貨記号を付けてロケール整形（fractionDigits 省略時は0桁）
export function formatAmount(amount: number, currency: Currency, fractionDigits = 0): string {
  return `${symbolFor(currency)}${amount.toLocaleString(undefined, { maximumFractionDigits: fractionDigits })}`
}
