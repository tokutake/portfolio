import { TONES } from '../constants'
import type { Holding } from '../types'

export type CsvHolding = {
  ticker: string
  name: string
  shares: number
  price: number
  currency: 'USD' | 'JPY'
}

export type CsvParseResult = {
  holdings: CsvHolding[]
  errors: string[]
}

// ヘッダー名 → 正規化キー
const HEADER_MAP: Record<string, string> = {
  ticker: 'ticker',
  symbol: 'ticker',
  code: 'ticker',
  '銘柄コード': 'ticker',
  '証券コード': 'ticker',
  'コード': 'ticker',
  name: 'name',
  '銘柄名': 'name',
  '銘柄': 'name',
  shares: 'shares',
  quantity: 'shares',
  qty: 'shares',
  '株数': 'shares',
  '数量': 'shares',
  '保有株数': 'shares',
  '保有数量': 'shares',
  price: 'price',
  average_price: 'price',
  avg_price: 'price',
  '取得単価': 'price',
  '単価': 'price',
  '平均取得単価': 'price',
  '平均取得価額': 'price',
  currency: 'currency',
  '通貨': 'currency',
  '建て': 'currency',
}

function normalizeHeader(h: string): string {
  const key = h.trim().replace(/^\uFEFF/, '').toLowerCase()
  // 日本語は lowerCase しても変わらないので元も見る
  const raw = h.trim().replace(/^\uFEFF/, '')
  return HEADER_MAP[key] || HEADER_MAP[raw] || key
}

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuote = !inQuote
      }
    } else if (c === ',' && !inQuote) {
      result.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  result.push(cur)
  return result.map((s) => s.trim().replace(/^"|"$/g, '').trim())
}

function parseNumber(raw: string): number | null {
  if (!raw) return null
  const n = Number(raw.replace(/[,¥$]/g, '').trim())
  return Number.isFinite(n) ? n : null
}

function detectCurrency(raw: string, priceRaw: string): 'USD' | 'JPY' {
  const v = raw.trim().toUpperCase()
  if (v === 'JPY' || v === '¥' || v === '円' || v === 'YEN') return 'JPY'
  if (v === 'USD' || v === '$' || v === '米ドル' || v === 'ドル') return 'USD'
  // 通貨列がなければ price の記号から推測
  if (priceRaw.trim().startsWith('¥')) return 'JPY'
  if (priceRaw.trim().startsWith('$')) return 'USD'
  return 'USD'
}

export function parseCsv(text: string): CsvParseResult {
  const errors: string[] = []
  const holdings: CsvHolding[] = []

  // BOM 除去 + 改行正規化
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n').filter((l) => l.trim() !== '')
  if (!lines.length) {
    return { holdings, errors: ['CSVが空です'] }
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeader)
  const hasHeader = headers.includes('ticker') || headers.includes('shares') || headers.includes('price')
  if (!hasHeader) {
    return { holdings, errors: ['ヘッダー行が見つかりません。1行目に ticker, shares, price などを含めてください'] }
  }

  const idxTicker = headers.indexOf('ticker')
  const idxName = headers.indexOf('name')
  const idxShares = headers.indexOf('shares')
  const idxPrice = headers.indexOf('price')
  const idxCurrency = headers.indexOf('currency')

  if (idxTicker === -1) errors.push('ticker / 銘柄コード 列が見つかりません')
  if (idxShares === -1) errors.push('shares / 株数 列が見つかりません')
  if (idxPrice === -1) errors.push('price / 取得単価 列が見つかりません')
  if (errors.length) return { holdings, errors }

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    // 空行スキップ
    if (cols.every((c) => !c.trim())) continue

    const ticker = (cols[idxTicker] || '').trim().toUpperCase()
    if (!ticker) {
      errors.push(`${i + 1}行目: tickerが空です`)
      continue
    }
    const name = idxName !== -1 ? (cols[idxName] || '').trim() : ''
    const sharesRaw = cols[idxShares] || ''
    const priceRaw = cols[idxPrice] || ''
    const currencyRaw = idxCurrency !== -1 ? (cols[idxCurrency] || '') : ''

    const shares = parseNumber(sharesRaw)
    const price = parseNumber(priceRaw)
    if (shares == null || shares <= 0) {
      errors.push(`${i + 1}行目 (${ticker}): 株数が不正です: "${sharesRaw}"`)
      continue
    }
    if (price == null || price <= 0) {
      errors.push(`${i + 1}行目 (${ticker}): 単価が不正です: "${priceRaw}"`)
      continue
    }
    const currency = detectCurrency(currencyRaw, priceRaw)
    holdings.push({ ticker, name: name || ticker, shares, price, currency })
  }

  if (!holdings.length && !errors.length) {
    errors.push('有効なデータ行がありませんでした')
  }

  return { holdings, errors }
}

export function csvHoldingsToHoldings(rows: CsvHolding[]): Holding[] {
  return rows.map((r, i) => {
    const tone = TONES[i % TONES.length]
    const symbol = r.currency === 'JPY' ? '¥' : '$'
    return {
      ticker: r.ticker,
      name: r.name || r.ticker,
      shares: String(r.shares),
      price: `${symbol}${r.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      value: `${symbol}${(r.shares * r.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      change: '—',
      tone,
    }
  })
}
