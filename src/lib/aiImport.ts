import { AI_MODEL } from '../constants'
import type { ExtractedHolding } from '../types'
import { fetchQuoteItem } from './marketdata'

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    reader.readAsDataURL(file)
  })
}

const PROMPT =
  'この証券口座のスクリーンショットから保有銘柄を抽出してください。JSONのみを返し、説明文は不要です。形式: {"holdings":[{"ticker":"AAPL","name":"Apple Inc.","shares":50,"average_price":210.12,"currency":"USD","amount":10500,"percent":10.5}]}。tickerは可能なら実際の証券コード(Symbol)を使い、米国株はVTI等のETFシンボルに変換してください。株数・平均価格が表示されている銘柄は shares と average_price に入れ、表示されず評価額だけの銘柄は shares を null にして amount(評価額, JPY) と percent(比率) に入れてください。読み取れない値は推測せず null にしてください。'

// スクリーンショットをOpenRouterで解析し、保有銘柄を抽出する
export async function analyzeScreenshot(dataUrl: string, apiKey: string): Promise<ExtractedHolding[]> {
  const response = await fetch('/openrouter/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  })
  const json = await response.json()
  if (!response.ok) throw new Error(json.error?.message || 'AI解析に失敗しました')
  const content = json.choices?.[0]?.message?.content || ''
  const parsed = JSON.parse(content.replace(/```json|```/g, '').trim()) as { holdings?: ExtractedHolding[] }
  return parsed.holdings || []
}

// 金額ベース(ROBOPRO)の銘柄を、現在株価から株数へ逆算。ROBOPRO銘柄は米国ETFなのでUSD建てで取り込む
export async function backfillShares(
  item: { ticker: string; amount?: number | null },
  fxRate: number,
): Promise<{ shares: string; price: string; value: string } | null> {
  const amount = Number(item.amount)
  if (!amount || amount <= 0) return null
  const q = await fetchQuoteItem(item.ticker)
  if (!q) return null
  // amount はJPY評価額 → USD換算 → 株数 = 金額 ÷ 株価
  const amountUsd = amount / fxRate
  const shares = amountUsd / q.price
  return {
    shares: shares.toFixed(4).replace(/\.?0+$/, ''),
    price: `$${q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
    value: `$${(shares * q.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
  }
}
