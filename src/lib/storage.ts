import {
  API_KEY_KEY,
  DEFAULT_FX_RATE,
  FX_KEY,
  INITIAL_HOLDINGS,
  PORTFOLIOS_KEY,
} from '../constants'
import type { CashAmount, Holding, Portfolio } from '../types'

export function loadFx(): number {
  try {
    const raw = window.localStorage.getItem(FX_KEY)
    const n = Number(raw)
    return n && n > 0 ? n : DEFAULT_FX_RATE
  } catch {
    return DEFAULT_FX_RATE
  }
}

export function saveFx(rate: number): void {
  window.localStorage.setItem(FX_KEY, String(rate))
}

export function getApiKey(): string {
  return window.localStorage.getItem(API_KEY_KEY) || ''
}

export function saveApiKey(key: string): void {
  window.localStorage.setItem(API_KEY_KEY, key)
}

export function savePortfolios(portfolios: Portfolio[]): void {
  window.localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(portfolios))
}

// 従来の単一 holdings / cash から最初のポートフォリオへ移行、以後は portfolios で管理
export function loadPortfolios(): Portfolio[] {
  try {
    const raw = window.localStorage.getItem(PORTFOLIOS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Portfolio[]
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* 破損時は再構築 */
  }

  let holdings: Holding[]
  try {
    const h = JSON.parse(window.localStorage.getItem('folio_holdings') || '') as Holding[]
    holdings = Array.isArray(h) ? h : INITIAL_HOLDINGS
  } catch {
    holdings = INITIAL_HOLDINGS
  }
  let cash: CashAmount = { usd: 7232.5, jpy: 0 }
  try {
    const c = JSON.parse(window.localStorage.getItem('folio_cash') || '') as { usd?: number; jpy?: number }
    cash = { usd: Number(c.usd) || 0, jpy: Number(c.jpy) || 0 }
  } catch {
    /* default */
  }
  return [{ id: 'default', name: 'Personal portfolio', holdings, cash }]
}
