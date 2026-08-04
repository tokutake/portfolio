import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DashboardPanels } from './components/DashboardPanels'
import { HoldingsTable } from './components/HoldingsTable'
import { Metrics } from './components/MetricCard'
import { PageHeading } from './components/PageHeading'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { AddHoldingModal } from './components/modals/AddHoldingModal'
import { AddPortfolioModal } from './components/modals/AddPortfolioModal'
import { CashModal } from './components/modals/CashModal'
import { EditModal } from './components/modals/EditModal'
import { ImporterModal } from './components/modals/ImporterModal'
import { RateModal } from './components/modals/RateModal'
import { ASSET_ETF, TONES } from './constants'
import { analyzeScreenshot, backfillShares, fileToDataUrl } from './lib/aiImport'
import { fetchQuotes, yahooSymbol } from './lib/marketdata'
import { aggregateHoldings, parseMoney, valueUsd } from './lib/money'
import { getApiKey, loadFx, loadPortfolios, saveApiKey, saveFx, savePortfolios } from './lib/storage'
import type { CashAmount, ExtractedHolding, Holding, Portfolio } from './types'

type NavTab = 'overview' | 'holdings'

function App() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(loadPortfolios)
  const [activeId, setActiveId] = useState<string>('all')
  const [active, setActive] = useState<NavTab>('overview')
  const [fxRate, setFxRate] = useState<number>(loadFx)
  const [valueSort, setValueSort] = useState<'asc' | 'desc' | null>(null)

  const [showImporter, setShowImporter] = useState(false)
  const [imageName, setImageName] = useState('')
  const [apiKey, setApiKey] = useState<string>(getApiKey)
  const [analyzing, setAnalyzing] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedHolding[]>([])
  const [importError, setImportError] = useState('')
  const [importTargetId, setImportTargetId] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState<Holding | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showCash, setShowCash] = useState(false)
  const [showFx, setShowFx] = useState(false)
  const [showAddPortfolio, setShowAddPortfolio] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')

  // localStorage への永続化
  useEffect(() => savePortfolios(portfolios), [portfolios])
  useEffect(() => saveFx(fxRate), [fxRate])

  // 現在の表示対象: 個別ポートフォリオ or 総合（全合算）
  const isAll = activeId === 'all'
  const current = portfolios.find((p) => p.id === activeId) || portfolios[0]
  const currentId = current?.id || 'all'
  const holdings = current?.holdings || []
  const cash: CashAmount = current?.cash || { usd: 0, jpy: 0 }

  const allHoldings = portfolios.flatMap((p) => p.holdings)
  const allCash: CashAmount = portfolios.reduce(
    (acc, p) => ({ usd: acc.usd + p.cash.usd, jpy: acc.jpy + p.cash.jpy }),
    { usd: 0, jpy: 0 },
  )
  const displayHoldings = isAll ? aggregateHoldings(allHoldings, fxRate) : holdings
  const displayCash = isAll ? allCash : cash

  // 両通貨の合計を計算（fxRate で換算）
  let totalUsd = displayCash.usd
  let totalJpy = displayCash.jpy
  displayHoldings.forEach((h) => {
    const { currency, amount } = parseMoney(h.value)
    if (currency === 'JPY') totalJpy += amount
    else totalUsd += amount
  })
  const totalInUsd = totalUsd + totalJpy / fxRate
  const totalInJpy = totalUsd * fxRate + totalJpy

  const sortedHoldings = valueSort
    ? [...displayHoldings].sort((a, b) =>
        valueSort === 'desc' ? valueUsd(b, fxRate) - valueUsd(a, fxRate) : valueUsd(a, fxRate) - valueUsd(b, fxRate),
      )
    : displayHoldings

  // ---- ハンドラ ----

  const handleFile = async (file?: File) => {
    if (!file) {
      setImageName('')
      setExtracted([])
      setImportError('')
      return
    }
    setImageName(file.name)
    setImportError('')
    setExtracted([])
    setAnalyzing(true)
    try {
      if (!apiKey.trim()) throw new Error('OpenRouter APIキーを入力してください')
      saveApiKey(apiKey.trim())
      const dataUrl = await fileToDataUrl(file)
      const items = await analyzeScreenshot(dataUrl, apiKey.trim())
      setExtracted(items)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'AI解析に失敗しました')
    } finally {
      setAnalyzing(false)
    }
  }

  const addExtracted = async (targetId?: string) => {
    const dest = targetId || importTargetId || currentId
    if (!dest || dest === 'all') return
    const additions: Holding[] = []
    for (const item of extracted) {
      if (!item.ticker) continue
      const realTicker = ASSET_ETF[item.ticker] || item.ticker
      const tone = TONES[additions.length % TONES.length]
      if (item.shares != null) {
        additions.push({
          ticker: realTicker,
          name: item.name || realTicker,
          shares: String(item.shares),
          price: `${item.currency === 'JPY' ? '¥' : '$'}${Number(item.average_price || 0).toFixed(2)}`,
          value: `${item.currency === 'JPY' ? '¥' : '$'}${(Number(item.shares) * Number(item.average_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          change: '—',
          tone,
        })
      } else {
        // 評価額(amount)のみ → 現在株価から株数を逆算
        const bf = await backfillShares({ ticker: realTicker, amount: item.amount }, fxRate)
        if (bf) {
          additions.push({ ticker: realTicker, name: item.name || realTicker, shares: bf.shares, price: bf.price, value: bf.value, change: '—', tone })
        }
      }
    }
    if (!additions.length) return
    setPortfolios((ps) => ps.map((p) => (p.id === dest ? { ...p, holdings: [...additions, ...p.holdings] } : p)))
    setShowImporter(false)
    setExtracted([])
    setImageName('')
    setImportTargetId('')
  }

  const removeHolding = (ticker: string) => {
    if (isAll) return
    setPortfolios((ps) => ps.map((p) => (p.id === currentId ? { ...p, holdings: p.holdings.filter((item) => item.ticker !== ticker) } : p)))
  }

  const updateHolding = (updated: Holding) => {
    if (isAll) return
    setPortfolios((ps) => ps.map((p) => (p.id === currentId ? { ...p, holdings: p.holdings.map((item) => (item.ticker === updated.ticker ? updated : item)) } : p)))
    setEditing(null)
  }

  const addHolding = (h: { ticker: string; name: string; currency: 'USD' | 'JPY'; shares: number; price: number; tone?: string }) => {
    if (isAll) return
    const symbol = h.currency === 'JPY' ? '¥' : '$'
    const newHolding: Holding = {
      ticker: h.ticker,
      name: h.name || h.ticker,
      shares: String(h.shares),
      price: `${symbol}${h.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      value: `${symbol}${(h.shares * h.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      change: '—',
      tone: h.tone || 'blue',
    }
    setPortfolios((ps) => ps.map((p) => (p.id === currentId ? { ...p, holdings: [newHolding, ...p.holdings] } : p)))
    setShowAdd(false)
  }

  const saveCash = (usd: number, jpy: number) => {
    if (isAll) return
    setPortfolios((ps) => ps.map((p) => (p.id === currentId ? { ...p, cash: { usd: usd || 0, jpy: jpy || 0 } } : p)))
    setShowCash(false)
  }

  const addPortfolio = (name: string) => {
    const id = `p${Date.now()}`
    setPortfolios((ps) => [...ps, { id, name: name.trim() || 'New portfolio', holdings: [], cash: { usd: 0, jpy: 0 } }])
    setActiveId(id)
    setShowAddPortfolio(false)
  }

  const removePortfolio = (id: string) => {
    if (portfolios.length <= 1) return
    setPortfolios((ps) => ps.filter((p) => p.id !== id))
    if (activeId === id) setActiveId('all')
  }

  // 株価・為替をYahoo Financeから一括更新
  const refreshPrices = async () => {
    setUpdating(true)
    setUpdateMsg('')
    const errors: string[] = []
    try {
      // 為替(JPY=X) + 全銘柄を1リクエストで取得
      const syms = holdings.map((h) => yahooSymbol(h.ticker, h.price.trim().startsWith('¥')))
      const quotes = await fetchQuotes(['JPY=X', ...syms])

      let fxNote = ''
      const fx = quotes.get('JPY=X')
      if (fx) {
        setFxRate(Math.round(fx.price))
        fxNote = '為替を更新'
      } else {
        errors.push('為替レートの取得に失敗')
      }

      const updated: (Holding | null)[] = holdings.map((h) => {
        const isJpy = h.price.trim().startsWith('¥')
        const q = quotes.get(yahooSymbol(h.ticker, isJpy))
        if (!q) {
          errors.push(`${h.ticker}: データなし`)
          return null
        }
        const shares = Number(h.shares) || 0
        const symbol = isJpy ? '¥' : '$'
        const changePct = q.prevClose ? ((q.price - q.prevClose) / q.prevClose) * 100 : 0
        const change = `${changePct >= 0 ? '+' : '-'}${Math.abs(changePct).toFixed(1)}%`
        return {
          ...h,
          price: `${symbol}${q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
          value: `${symbol}${(shares * q.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          change,
        }
      })

      const ok = updated.filter((h): h is Holding => h !== null)
      if (ok.length) setPortfolios((ps) => ps.map((p) => (p.id === currentId ? { ...p, holdings: ok } : p)))
      const parts = [fxNote, ok.length ? `${ok.length}銘柄を更新` : ''].filter(Boolean)
      setUpdateMsg([...parts, ...(errors.length ? [`エラー: ${errors.join(' · ')}`] : [])].join(' · ') || '更新に失敗しました')
    } catch (e) {
      setUpdateMsg(e instanceof Error ? e.message : '更新に失敗しました')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        portfolios={portfolios}
        activeId={activeId}
        holdingsCount={displayHoldings.length}
        active={active}
        onSelectPortfolio={setActiveId}
        onShowTab={setActive}
        onAiImport={() => setShowImporter(true)}
        onAddPortfolio={() => setShowAddPortfolio(true)}
        onRemovePortfolio={removePortfolio}
      />

      <main className="main-content">
        <Topbar />
        <div className="content-wrap">
          <PageHeading onImport={() => setShowImporter(true)} />
          <Metrics
            usd={totalInUsd}
            jpy={totalInJpy}
            fxRate={fxRate}
            cashUsd={displayCash.usd}
            cashJpy={displayCash.jpy}
            onRate={() => setShowFx(true)}
          />
          <DashboardPanels />
          <HoldingsTable
            holdings={sortedHoldings}
            fxRate={fxRate}
            isAll={isAll}
            currentName={current?.name || 'portfolio'}
            valueSort={valueSort}
            updating={updating}
            onSortToggle={() => setValueSort(valueSort === 'desc' ? 'asc' : 'desc')}
            onRefresh={refreshPrices}
            onCash={() => setShowCash(true)}
            onAdd={() => setShowAdd(true)}
            onEdit={setEditing}
            onRemove={removeHolding}
          />
          <section className="ai-callout">
            <div className="ai-orb"><Sparkles size={22} /></div>
            <div>
              <p className="eyebrow">FOLIO AI</p>
              <h2>Turn a screenshot into your portfolio</h2>
              <p>Upload a brokerage screenshot and let AI extract tickers, shares, and prices for you. No manual entry needed.</p>
            </div>
            <button className="primary-button" onClick={() => setShowImporter(true)}>Try AI import <ArrowUpRight size={15} /></button>
          </section>
          {updateMsg && <div className="update-msg">{updateMsg}</div>}
        </div>
      </main>

      {showImporter && (
        <ImporterModal
          apiKey={apiKey}
          setApiKey={setApiKey}
          imageName={imageName}
          analyzing={analyzing}
          extracted={extracted}
          error={importError}
          fileRef={fileRef}
          portfolios={portfolios}
          targetId={importTargetId}
          lastPortfolio={currentId}
          setTargetId={setImportTargetId}
          onFile={handleFile}
          onAdd={addExtracted}
          onClose={() => setShowImporter(false)}
        />
      )}
      {editing && <EditModal holding={editing} onSave={updateHolding} onClose={() => setEditing(null)} />}
      {showAdd && <AddHoldingModal onAdd={addHolding} onClose={() => setShowAdd(false)} />}
      {showCash && <CashModal usd={displayCash.usd} jpy={displayCash.jpy} fxRate={fxRate} onSave={saveCash} onClose={() => setShowCash(false)} />}
      {showFx && <RateModal fxRate={fxRate} setFxRate={setFxRate} onClose={() => setShowFx(false)} />}
      {showAddPortfolio && <AddPortfolioModal onAdd={addPortfolio} onClose={() => setShowAddPortfolio(false)} />}
    </div>
  )
}

export default App
