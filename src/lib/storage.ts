import {
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

export function savePortfolios(portfolios: Portfolio[]): void {
  window.localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(portfolios))
}

export type ExportPayload = {
  version: 1
  exportedAt: string
  fxRate: number
  portfolios: Portfolio[]
}

export function buildExportPayload(portfolios: Portfolio[], fxRate: number): ExportPayload {
  return { version: 1, exportedAt: new Date().toISOString(), fxRate, portfolios }
}

export function parseImportPayload(json: string): { portfolios: Portfolio[]; fxRate: number | null } {
  const data = JSON.parse(json) as unknown
  // 新形式: { version, portfolios, fxRate }
  if (data && typeof data === 'object' && 'portfolios' in data) {
    const obj = data as { portfolios: unknown; fxRate?: unknown }
    if (!Array.isArray(obj.portfolios)) throw new Error('portfolios は配列である必要があります')
    validatePortfolios(obj.portfolios)
    const fxRate = typeof obj.fxRate === 'number' && obj.fxRate > 0 ? obj.fxRate : null
    return { portfolios: obj.portfolios as Portfolio[], fxRate }
  }
  // 旧/シンプル形式: Portfolio[] そのまま
  if (Array.isArray(data)) {
    validatePortfolios(data)
    return { portfolios: data as Portfolio[], fxRate: null }
  }
  throw new Error('不正なフォーマットです')
}

function validatePortfolios(portfolios: unknown[]): void {
  for (const p of portfolios) {
    if (!p || typeof p !== 'object') throw new Error('不正なポートフォリオデータです')
    const o = p as Record<string, unknown>
    if (typeof o.id !== 'string' || typeof o.name !== 'string' || !Array.isArray(o.holdings)) {
      throw new Error('不正なポートフォリオデータです')
    }
  }
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
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
