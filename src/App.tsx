import { ArrowUpRight, FileSpreadsheet } from 'lucide-react'
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
import { CsvImporterModal } from './components/modals/CsvImporterModal'
import { EditModal } from './components/modals/EditModal'
import { RateModal } from './components/modals/RateModal'
import { fetchQuotes, yahooSymbol } from './lib/marketdata'
import { aggregateHoldings, parseMoney, valueUsd } from './lib/money'
import { buildExportPayload, downloadJson, loadFx, loadPortfolios, parseImportPayload, saveFx, savePortfolios } from './lib/storage'
import { csvHoldingsToHoldings, parseCsv } from './lib/csvImport'
import type { CashAmount, Holding, Portfolio } from './types'
import type { CsvHolding } from './lib/csvImport'

type NavTab = 'overview' | 'holdings'

function App() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>(loadPortfolios)
  const [activeId, setActiveId] = useState<string>('all')
  const [active, setActive] = useState<NavTab>('overview')
  const [fxRate, setFxRate] = useState<number>(loadFx)
  const [valueSort, setValueSort] = useState<'asc' | 'desc' | null>(null)

  const [showCsvImporter, setShowCsvImporter] = useState(false)
  const [csvFileName, setCsvFileName] = useState('')
  const [csvHoldings, setCsvHoldings] = useState<CsvHolding[]>([])
  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [importTargetId, setImportTargetId] = useState<string>('')
  const csvFileRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState<Holding | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showCash, setShowCash] = useState(false)
  const [showFx, setShowFx] = useState(false)
  const [showAddPortfolio, setShowAddPortfolio] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')
  const jsonImportRef = useRef<HTMLInputElement>(null)

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

  const handleCsvFile = async (file?: File) => {
    if (!file) {
      setCsvFileName('')
      setCsvHoldings([])
      setCsvErrors([])
      return
    }
    setCsvFileName(file.name)
    try {
      const text = await file.text()
      const { holdings, errors } = parseCsv(text)
      setCsvHoldings(holdings)
      setCsvErrors(errors)
    } catch (error) {
      setCsvErrors([error instanceof Error ? error.message : 'CSV解析に失敗しました'])
      setCsvHoldings([])
    }
  }

  const addCsvHoldings = (targetId?: string) => {
    const dest = targetId || importTargetId || currentId
    if (!dest || dest === 'all') return
    if (!csvHoldings.length) return
    const additions = csvHoldingsToHoldings(csvHoldings)
    setPortfolios((ps) => ps.map((p) => (p.id === dest ? { ...p, holdings: [...additions, ...p.holdings] } : p)))
    setShowCsvImporter(false)
    setCsvHoldings([])
    setCsvFileName('')
    setCsvErrors([])
    setImportTargetId('')
    setUpdateMsg(`${additions.length}件をCSVから追加しました`)
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

  const handleExport = () => {
    const payload = buildExportPayload(portfolios, fxRate)
    const date = new Date().toISOString().slice(0, 10)
    downloadJson(`folio-export-${date}.json`, payload)
    setUpdateMsg(`エクスポートしました: ${portfolios.length}ポートフォリオ`)
  }

  const handleImportJsonFile = async (file?: File) => {
    if (!file) return
    try {
      const text = await file.text()
      const { portfolios: imported, fxRate: importedFx } = parseImportPayload(text)
      setPortfolios(imported)
      if (importedFx != null) setFxRate(importedFx)
      setUpdateMsg(`インポートしました: ${imported.length}ポートフォリオ${importedFx != null ? ' + 為替レート' : ''}`)
    } catch (e) {
      setUpdateMsg(e instanceof Error ? `インポート失敗: ${e.message}` : 'インポートに失敗しました')
    } finally {
      if (jsonImportRef.current) jsonImportRef.current.value = ''
    }
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
        onCsvImport={() => setShowCsvImporter(true)}
        onAddPortfolio={() => setShowAddPortfolio(true)}
        onRemovePortfolio={removePortfolio}
      />

      <main className="main-content">
        <Topbar />
        <div className="content-wrap">
          <PageHeading onCsvImport={() => setShowCsvImporter(true)} onExport={handleExport} onImportJson={() => jsonImportRef.current?.click()} />
          <input ref={jsonImportRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => handleImportJsonFile(e.target.files?.[0])} />
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
            <div className="ai-orb"><FileSpreadsheet size={22} /></div>
            <div>
              <p className="eyebrow">CSV IMPORT</p>
              <h2>Import from your broker</h2>
              <p>証券会社の取引履歴CSVから保有銘柄を一括登録。RoboPro等のPDFは別途対応予定。</p>
            </div>
            <button className="primary-button" onClick={() => setShowCsvImporter(true)}>Import CSV <ArrowUpRight size={15} /></button>
          </section>
          {updateMsg && <div className="update-msg">{updateMsg}</div>}
        </div>
      </main>

      {showCsvImporter && (
        <CsvImporterModal
          fileName={csvFileName}
          holdings={csvHoldings}
          errors={csvErrors}
          portfolios={portfolios}
          targetId={importTargetId}
          lastPortfolio={currentId}
          setTargetId={setImportTargetId}
          fileRef={csvFileRef}
          onFile={handleCsvFile}
          onAdd={addCsvHoldings}
          onClose={() => {
            setShowCsvImporter(false)
            setCsvFileName('')
            setCsvHoldings([])
            setCsvErrors([])
          }}
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
