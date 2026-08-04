import type { Holding } from './types'

// localStorage キー
export const PORTFOLIOS_KEY = 'folio_portfolios'
export const FX_KEY = 'folio_fx'
export const API_KEY_KEY = 'openrouter_api_key'

export const DEFAULT_FX_RATE = 150

// AIスクショ抽出に使うモデル
export const AI_MODEL = 'google/gemini-2.5-flash'

// 銘柄カードの色テーマ（追加時に順番に割り当てる）
export const TONES = ['green', 'blue', 'purple', 'orange']

// ROBOPRO 等の資産クラス名 → 実際のETFティッカー（金額ベース取り込み用）
export const ASSET_ETF: Record<string, string> = {
  米国株: 'VTI',
  先進国株: 'VEA',
  新興国株: 'VWO',
  米国リート: 'IYR',
  金: 'GLD',
  米国債券: 'BND',
  ハイイールド債: 'HYG',
  新興国債券: 'EMB',
}

// レガシー単一ポートフォリオ時代の初期データ（移行時・初回のみ使用）
export const INITIAL_HOLDINGS: Holding[] = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', shares: '120', price: '$118.33', value: '$14,199.60', change: '+42.8%', tone: 'green' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', shares: '36', price: '$503.43', value: '$18,123.48', change: '+17.3%', tone: 'blue' },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', shares: '28', price: '$621.19', value: '$17,393.32', change: '+12.6%', tone: 'purple' },
  { ticker: 'AAPL', name: 'Apple Inc.', shares: '50', price: '$211.18', value: '$10,559.00', change: '+8.1%', tone: 'orange' },
]

// アロケーションパネルの凡例（静的なデモ表示）
export const ALLOCATION = [
  { label: '米国株', value: 61, color: '#3559e6' },
  { label: 'ETF', value: 27, color: '#8b78e8' },
  { label: '現金', value: 12, color: '#d8dde8' },
]
