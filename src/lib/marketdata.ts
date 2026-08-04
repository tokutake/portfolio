import type { Quote } from '../types'

// Yahoo Finance のシンボルに変換（日本株は .T 付与、米国株/ETFはそのまま）
export function yahooSymbol(ticker: string, isJpy: boolean): string {
  return isJpy ? `${ticker}.T` : ticker
}

// 複数シンボルを一度に取得（/marketdata/multi 集約API）
export async function fetchQuotes(symbols: string[]): Promise<Map<string, Quote>> {
  const quotes = new Map<string, Quote>()
  if (!symbols.length) return quotes
  const res = await fetch(`/marketdata/multi?symbols=${encodeURIComponent(symbols.join(','))}`)
  if (!res.ok) return quotes
  const json = await res.json()
  for (const r of (json?.quoteResponse?.result || []) as {
    symbol: string
    regularMarketPrice: number
    regularMarketPreviousClose?: number | null
  }[]) {
    if (r.regularMarketPrice != null) {
      quotes.set(r.symbol, { price: r.regularMarketPrice, prevClose: r.regularMarketPreviousClose ?? null })
    }
  }
  return quotes
}

// 単一シンボルの現在価格を取得
export async function fetchQuoteItem(symbol: string): Promise<{ price: number } | null> {
  try {
    const quotes = await fetchQuotes([symbol])
    const q = quotes.get(symbol)
    return q ? { price: q.price } : null
  } catch {
    return null
  }
}
