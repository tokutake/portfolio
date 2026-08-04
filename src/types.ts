export type Currency = 'USD' | 'JPY'

// 表示用の成形済み文字列を持った保有銘柄（値はすべて文字列で保持する）
export type Holding = {
  ticker: string
  name: string
  shares: string
  price: string
  value: string
  change: string
  tone: string
}

// AIスクショ抽出の生データ（株数 or 評価額のみのケースがある）
export type ExtractedHolding = {
  ticker: string
  name: string
  shares: number | null
  average_price: number | null
  currency: string
  amount?: number | null
  percent?: number | null
}

export type CashAmount = { usd: number; jpy: number }

export type Portfolio = {
  id: string
  name: string
  holdings: Holding[]
  cash: CashAmount
}

export type Quote = { price: number; prevClose: number | null }

// Add holding モーダルの入力値
export type AddHoldingInput = {
  ticker: string
  name: string
  currency: Currency
  shares: number
  price: number
  tone?: string
}
