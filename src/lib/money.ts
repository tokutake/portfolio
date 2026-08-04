import type { Currency, Holding } from '../types'

// 総合(全ポートフォリオ合算)表示用: 同一ティッカーの保有を1行に合算する。
// tickerが1つだけならそのまま返し、複数なら株数・評価額を合計して1行にまとめる。
export function aggregateHoldings(holdings: Holding[], fxRate: number): Holding[] {
  if (holdings.length <= 1) return holdings
  const groups = new Map<string, Holding[]>()
  for (const h of holdings) {
    const list = groups.get(h.ticker) ?? []
    list.push(h)
    groups.set(h.ticker, list)
  }
  const result: Holding[] = []
  for (const [ticker, list] of groups) {
    if (list.length === 1) {
      result.push(list[0])
      continue
    }
    const first = list[0]
    const firstIsJpy = first.value.trim().startsWith('¥')
    // 混在通貨を考慮し、いったんUSDに揃えて合算（JPY→USD / USD→そのまま）
    const toUsd = (h: Holding) => {
      const { currency, amount } = parseMoney(h.value)
      return currency === 'JPY' ? amount / fxRate : amount
    }
    const shares = list.reduce((s, h) => s + (Number(h.shares) || 0), 0)
    const usdTotal = list.reduce((s, h) => s + toUsd(h), 0)
    const symbol = firstIsJpy ? '¥' : '$'
    const nativeTotal = firstIsJpy ? usdTotal * fxRate : usdTotal
    const price = shares > 0 ? nativeTotal / shares : 0
    result.push({
      ...first,
      ticker,
      shares: String(shares),
      price: `${symbol}${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      value: `${symbol}${nativeTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    })
  }
  return result
}

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
