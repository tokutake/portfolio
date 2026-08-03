import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Yahoo Finance のチャートAPIは1シンボルずつしか受け付けないため、
// サーバー側で複数シンボルをまとめて取得し、1レスポンスで返す集約エンドポイントを追加する。
// ブラウザからは /marketdata/multi?symbols=AAPL,MSFT の1リクエストで全銘柄が取れる。
function marketDataProxy(): Plugin[] {
  const fetchQuote = async (symbol: string) => {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) return null
    const json = await res.json()
    const meta = json?.chart?.result?.[0]?.meta
    if (!meta || meta.regularMarketPrice == null) return null
    return {
      symbol,
      regularMarketPrice: meta.regularMarketPrice,
      regularMarketPreviousClose: meta.chartPreviousClose ?? null,
      currency: meta.currency ?? null,
    }
  }

  const handler = (req: any, res: any, next: any) => {
    if (!req.url || !req.url.startsWith('/marketdata/multi')) return next()
    const url = new URL(req.url, 'http://localhost')
    const symbols = (url.searchParams.get('symbols') || '').split(',').filter(Boolean)
    if (!symbols.length) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ quoteResponse: { result: [] } }))
      return
    }
    Promise.all(symbols.map(fetchQuote)).then((results) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ quoteResponse: { result: results.filter(Boolean) } }))
    }).catch(() => {
      res.statusCode = 502
      res.end(JSON.stringify({ error: 'market data fetch failed' }))
    })
  }

  return [{
    name: 'market-data-proxy',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }]
}

export default defineConfig({
  plugins: [react(), ...marketDataProxy()],
  server: {
    proxy: {
      '/openrouter': {
        target: 'https://openrouter.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openrouter/, ''),
      },
    },
  },
  preview: {},
})
