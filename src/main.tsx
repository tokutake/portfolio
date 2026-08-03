import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  CircleHelp,
  FileImage,
  Home,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Upload,
  WalletCards,
  X,
} from 'lucide-react'
import './styles.css'

type Holding = { ticker: string; name: string; shares: string; price: string; value: string; change: string; tone: string }
type ExtractedHolding = { ticker: string; name: string; shares: number; average_price: number; currency: string }

const initialHoldings: Holding[] = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', shares: '120', price: '$118.33', value: '$14,199.60', change: '+42.8%', tone: 'green' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', shares: '36', price: '$503.43', value: '$18,123.48', change: '+17.3%', tone: 'blue' },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', shares: '28', price: '$621.19', value: '$17,393.32', change: '+12.6%', tone: 'purple' },
  { ticker: 'AAPL', name: 'Apple Inc.', shares: '50', price: '$211.18', value: '$10,559.00', change: '+8.1%', tone: 'orange' },
]

const HOLDINGS_KEY = 'folio_holdings'
const CASH_KEY = 'folio_cash'

function loadCash(): { usd: number; jpy: number } {
  try {
    const raw = window.localStorage.getItem(CASH_KEY)
    if (!raw) return { usd: 7232.5, jpy: 0 }
    const parsed = JSON.parse(raw) as { usd?: number; jpy?: number }
    return { usd: Number(parsed.usd) || 0, jpy: Number(parsed.jpy) || 0 }
  } catch {
    return { usd: 7232.5, jpy: 0 }
  }
}

function loadHoldings(): Holding[] {
  try {
    const raw = window.localStorage.getItem(HOLDINGS_KEY)
    if (!raw) return initialHoldings
    const parsed = JSON.parse(raw) as Holding[]
    if (!Array.isArray(parsed)) return initialHoldings
    return parsed
  } catch {
    return initialHoldings
  }
}

const allocation = [
  { label: '米国株', value: 61, color: '#3559e6' },
  { label: 'ETF', value: 27, color: '#8b78e8' },
  { label: '現金', value: 12, color: '#d8dde8' },
]

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('画像の読み込みに失敗しました'))
    reader.readAsDataURL(file)
  })
}

function App() {
  const [holdings, setHoldings] = useState<Holding[]>(loadHoldings)
  const [active, setActive] = useState('overview')
  const [showImporter, setShowImporter] = useState(false)
  const [imageName, setImageName] = useState('')
  const [apiKey, setApiKey] = useState(() => window.localStorage.getItem('openrouter_api_key') || '')
  const [analyzing, setAnalyzing] = useState(false)
  const [extracted, setExtracted] = useState<ExtractedHolding[]>([])
  const [importError, setImportError] = useState('')
  const [editing, setEditing] = useState<Holding | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [cash, setCash] = useState<{ usd: number; jpy: number }>(loadCash)
  const [showCash, setShowCash] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdings))
  }, [holdings])

  useEffect(() => {
    window.localStorage.setItem(CASH_KEY, JSON.stringify(cash))
  }, [cash])

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
      window.localStorage.setItem('openrouter_api_key', apiKey.trim())
      const dataUrl = await fileToDataUrl(file)
      const response = await fetch('/openrouter/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          temperature: 0,
          messages: [{ role: 'user', content: [
            { type: 'text', text: 'この証券口座のスクリーンショットから保有銘柄を抽出してください。JSONのみを返し、説明文は不要です。形式: {"holdings":[{"ticker":"AAPL","name":"Apple Inc.","shares":50,"average_price":210.12,"currency":"USD"}]}。読み取れない値は推測せず null にしてください。' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ] }],
        }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error?.message || 'AI解析に失敗しました')
      const content = json.choices?.[0]?.message?.content || ''
      const parsed = JSON.parse(content.replace(/```json|```/g, '').trim()) as { holdings?: ExtractedHolding[] }
      setExtracted(parsed.holdings || [])
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'AI解析に失敗しました')
    } finally {
      setAnalyzing(false)
    }
  }

  const addExtracted = () => {
    const additions = extracted.filter((item) => item.ticker && item.shares != null).map((item, index) => ({
      ticker: item.ticker, name: item.name || item.ticker, shares: String(item.shares), price: `${item.currency === 'JPY' ? '¥' : '$'}${Number(item.average_price || 0).toFixed(2)}`,
      value: `${item.currency === 'JPY' ? '¥' : '$'}${(Number(item.shares) * Number(item.average_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, change: '—', tone: ['green', 'blue', 'purple', 'orange'][index % 4],
    }))
    setHoldings((items) => [...additions, ...items])
    setShowImporter(false)
    setExtracted([])
    setImageName('')
  }

  const removeHolding = (ticker: string) => setHoldings((items) => items.filter((item) => item.ticker !== ticker))

  const updateHolding = (updated: Holding) => {
    setHoldings((items) => items.map((item) => (item.ticker === updated.ticker ? updated : item)))
    setEditing(null)
  }

  const addHolding = (h: { ticker: string; name: string; currency: 'USD' | 'JPY'; shares: number; price: number; tone?: string }) => {
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
    setHoldings((items) => [newHolding, ...items])
    setShowAdd(false)
  }

  const addCash = (currency: 'USD' | 'JPY', amount: number) => {
    if (!amount || amount <= 0) return
    setCash((prev) => (currency === 'USD' ? { ...prev, usd: prev.usd + amount } : { ...prev, jpy: prev.jpy + amount }))
    setShowCash(false)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><BarChart3 size={17} strokeWidth={2.7} /></div><span>folio</span></div>
        <div className="workspace-switcher"><div className="workspace-avatar">T</div><div><strong>Tokutake</strong><small>Personal portfolio</small></div><ChevronDown size={15} /></div>
        <nav className="nav">
          <p className="nav-label">WORKSPACE</p>
          <button className={active === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => setActive('overview')}><Home size={17} />Overview</button>
          <button className={active === 'holdings' ? 'nav-item active' : 'nav-item'} onClick={() => setActive('holdings')}><WalletCards size={17} />Holdings <span className="nav-count">{holdings.length}</span></button>
          <button className="nav-item" onClick={() => setShowImporter(true)}><Sparkles size={17} />AI Import <span className="new-pill">NEW</span></button>
          <button className="nav-item"><LayoutGrid size={17} />Allocation</button>
          <p className="nav-label second">TOOLS</p>
          <button className="nav-item"><BarChart3 size={17} />Performance</button>
          <button className="nav-item"><Bell size={17} />Alerts <span className="alert-dot" /></button>
        </nav>
        <div className="sidebar-bottom"><button className="nav-item"><Settings size={17} />Settings</button><button className="nav-item"><CircleHelp size={17} />Help center</button><div className="upgrade-card"><div className="upgrade-icon"><Sparkles size={15} /></div><strong>Make smarter moves</strong><span>Unlock advanced insights with folio Pro.</span><button>Explore Pro <ArrowUpRight size={13} /></button></div><div className="profile"><div className="profile-avatar">TK</div><div><strong>Tokutake</strong><small>Free plan</small></div><MoreHorizontal size={17} /></div></div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumbs"><span>Portfolio</span><span>/</span><strong>Overview</strong></div><div className="top-actions"><div className="search"><Search size={16} /><input placeholder="Search holdings..." /></div><button className="icon-button"><Bell size={18} /></button><button className="avatar-small">TK</button></div></header>
        <div className="content-wrap">
          <section className="page-heading"><div><p className="eyebrow">TUESDAY, JUNE 17, 2025 <span className="live-dot" />MARKET OPEN</p><h1>Good morning, Tokutake <span>✦</span></h1><p className="subheading">Here's how your portfolio is doing today.</p></div><div className="heading-actions"><button className="secondary-button"><ArrowDownToLine size={16} />Export</button><button className="primary-button" onClick={() => setShowImporter(true)}><Sparkles size={16} />Import with AI</button></div></section>
          <section className="metrics-grid"><Metric label="Total portfolio value" value="$60,275.40" change="+$1,842.24" percent="+3.15%" icon={<WalletCards size={18} />} positive /><Metric label="Today’s return" value="+$1,204.82" change="Since market open" percent="+2.04%" icon={<BarChart3 size={18} />} positive /><Metric label="Total return" value="+$12,486.90" change="Since inception" percent="+26.12%" icon={<ArrowUpRight size={18} />} positive /><Metric label="Cash available" value={`$${cash.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} change={`¥${cash.jpy.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} percent="" icon={<WalletCards size={18} />} /></section>
          <div className="dashboard-grid"><section className="panel performance-panel"><div className="panel-heading"><div><h2>Portfolio performance</h2><p>Track your portfolio value over time</p></div><div className="range-tabs"><button>1W</button><button>1M</button><button className="selected">3M</button><button>1Y</button><button>ALL</button></div></div><div className="chart-wrap"><div className="chart-y"><span>$65k</span><span>$60k</span><span>$55k</span><span>$50k</span><span>$45k</span></div><svg viewBox="0 0 720 250" preserveAspectRatio="none" className="chart"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4264e8" stopOpacity=".2" /><stop offset="100%" stopColor="#4264e8" stopOpacity="0" /></linearGradient></defs><path d="M0,214 C28,208 45,210 62,192 S99,174 118,186 S148,161 175,169 S209,149 226,154 S255,122 280,134 S316,115 337,121 S360,95 390,104 S425,79 446,89 S475,63 504,72 S538,45 564,56 S597,31 625,46 S657,26 681,32 S708,18 720,20 L720,250 L0,250Z" fill="url(#area)" /><path d="M0,214 C28,208 45,210 62,192 S99,174 118,186 S148,161 175,169 S209,149 226,154 S255,122 280,134 S316,115 337,121 S360,95 390,104 S425,79 446,89 S475,63 504,72 S538,45 564,56 S597,31 625,46 S657,26 681,32 S708,18 720,20" fill="none" stroke="#4264e8" strokeWidth="3" strokeLinecap="round" /></svg><div className="chart-x"><span>Mar 17</span><span>Apr 01</span><span>Apr 15</span><span>May 01</span><span>May 15</span><span>Jun 01</span><span>Jun 17</span></div></div></section><section className="panel allocation-panel"><div className="panel-heading"><div><h2>Allocation</h2><p>Where your money is invested</p></div><button className="more-button"><MoreHorizontal size={18} /></button></div><div className="donut-area"><div className="donut"><div className="donut-hole"><strong>88%</strong><span>Invested</span></div></div><div className="legend">{allocation.map((item) => <div className="legend-row" key={item.label}><span className="legend-swatch" style={{ background: item.color }} /><span>{item.label}</span><strong>{item.value}%</strong></div>)}</div></div><button className="text-button">View allocation details <ArrowUpRight size={14} /></button></section></div>
          <section className="panel holdings-panel"><div className="panel-heading"><div><h2>Your holdings <span className="count-badge">{holdings.length}</span></h2><p>Positions in your portfolio</p></div><div className="holding-actions"><button className="ghost-button" onClick={() => setShowCash(true)}><WalletCards size={15} />Add cash</button><button className="add-button" onClick={() => setShowAdd(true)}><Plus size={16} />Add holding</button></div></div><div className="table"><div className="table-head"><span>ASSET</span><span>SHARES</span><span>PRICE</span><span>VALUE</span><span>RETURN</span><span /></div>{holdings.map((holding) => <div className="table-row" key={holding.ticker}><div className="asset-cell"><div className={`ticker-logo ${holding.tone}`}>{holding.ticker.slice(0, 1)}</div><div><strong>{holding.ticker}</strong><small>{holding.name}</small></div></div><span>{holding.shares}</span><span>{holding.price}</span><strong>{holding.value}</strong><span className="positive">{holding.change}</span><div className="row-actions"><button className="row-menu" onClick={() => setEditing(holding)} title="Edit holding"><Pencil size={15} /></button><button className="row-menu" onClick={() => removeHolding(holding.ticker)} title="Remove holding"><MoreHorizontal size={17} /></button></div></div>)}</div></section>
          <section className="ai-callout"><div className="ai-orb"><Sparkles size={22} /></div><div><p className="eyebrow">FOLIO AI</p><h2>Turn a screenshot into your portfolio</h2><p>Upload a brokerage screenshot and let AI extract tickers, shares, and prices for you. No manual entry needed.</p></div><button className="primary-button" onClick={() => setShowImporter(true)}>Try AI import <ArrowUpRight size={15} /></button></section>
        </div>
      </main>
      {showImporter && <ImporterModal apiKey={apiKey} setApiKey={setApiKey} imageName={imageName} analyzing={analyzing} extracted={extracted} error={importError} fileRef={fileRef} onFile={handleFile} onAdd={addExtracted} onClose={() => setShowImporter(false)} />}
      {editing && <EditModal holding={editing} onSave={updateHolding} onClose={() => setEditing(null)} />}
      {showAdd && <AddHoldingModal onAdd={addHolding} onClose={() => setShowAdd(false)} />}
      {showCash && <CashModal onAdd={addCash} onClose={() => setShowCash(false)} />}
    </div>
  )
}

function Metric({ label, value, change, percent, icon, positive }: { label: string; value: string; change: string; percent: string; icon: React.ReactNode; positive?: boolean }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><div className="metric-icon">{icon}</div></div><strong className="metric-value">{value}</strong><div className="metric-foot"><span className={positive ? 'positive' : ''}>{change}</span>{percent && <span className="percent-pill">{percent}</span>}</div></div>
}

function stripSymbol(s: string): string {
  return s.replace(/[^0-9.,-]/g, '')
}

function CashModal({ onAdd, onClose }: { onAdd: (currency: 'USD' | 'JPY', amount: number) => void; onClose: () => void }) {
  const [currency, setCurrency] = useState<'USD' | 'JPY'>('USD')
  const [amount, setAmount] = useState('')
  const symbol = currency === 'JPY' ? '¥' : '$'
  const numAmount = Number(amount) || 0
  const valid = numAmount > 0

  const save = () => {
    if (!valid) return
    onAdd(currency, numAmount)
  }

  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><div className="modal-kicker"><WalletCards size={14} />ADD CASH</div><h2>Add cash</h2><p>Track your available cash. Choose the currency and enter the amount.</p></div><button className="close-button" onClick={onClose}><X size={18} /></button></div><div className="market-toggle"><button className={currency === 'USD' ? 'selected' : ''} onClick={() => setCurrency('USD')}><span className="flag">$</span>US ドル</button><button className={currency === 'JPY' ? 'selected' : ''} onClick={() => setCurrency('JPY')}><span className="flag">¥</span>日本円</button></div><label className="api-key-field"><span>AMOUNT ({symbol})</span><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0" autoFocus /></label><div className="modal-footer" style={{ marginTop: 0 }}><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save} disabled={!valid}><Plus size={16} />Add cash</button></div></div></div>
}

function AddHoldingModal({ onAdd, onClose }: { onAdd: (h: { ticker: string; name: string; currency: 'USD' | 'JPY'; shares: number; price: number; tone?: string }) => void; onClose: () => void }) {
  const [currency, setCurrency] = useState<'USD' | 'JPY'>('USD')
  const [ticker, setTicker] = useState('')
  const [name, setName] = useState('')
  const [shares, setShares] = useState('')
  const [price, setPrice] = useState('')
  const symbol = currency === 'JPY' ? '¥' : '$'
  const numShares = Number(shares) || 0
  const numPrice = Number(price) || 0
  const value = symbol + (numShares * numPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })
  const valid = ticker.trim() && numShares > 0 && numPrice > 0
  const tone = currency === 'JPY' ? 'green' : currency === 'USD' ? 'blue' : 'blue'

  const save = () => {
    if (!valid) return
    onAdd({ ticker: ticker.trim().toUpperCase(), name: name.trim(), currency, shares: numShares, price: numPrice, tone })
  }

  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><div className="modal-kicker"><Plus size={14} />ADD HOLDING</div><h2>Add holding</h2><p>Add a stock holding manually. Choose the market and fill in the details.</p></div><button className="close-button" onClick={onClose}><X size={18} /></button></div><div className="market-toggle"><button className={currency === 'USD' ? 'selected' : ''} onClick={() => setCurrency('USD')}><span className="flag">US</span>アメリカ</button><button className={currency === 'JPY' ? 'selected' : ''} onClick={() => setCurrency('JPY')}><span className="flag">JP</span>日本</button></div><label className="api-key-field"><span>{currency === 'USD' ? 'TICKER' : '証券コード'}</span><input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder={currency === 'USD' ? 'AAPL' : '7203'} /></label><label className="api-key-field"><span>{currency === 'USD' ? 'NAME' : '銘柄名'}</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={currency === 'USD' ? 'Apple Inc.' : 'トヨタ自動車'} /></label><div className="edit-grid"><label className="api-key-field"><span>{currency === 'USD' ? 'SHARES' : '株数'}</span><input type="number" value={shares} onChange={(e) => setShares(e.target.value)} inputMode="decimal" placeholder="100" /></label><label className="api-key-field"><span>PRICE ({symbol})</span><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="150.00" /></label></div><div className="edit-value"><span>VALUE</span><strong>{value}</strong></div><div className="modal-footer"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save} disabled={!valid}><Plus size={16} />Add holding</button></div></div></div>
}

function EditModal({ holding, onSave, onClose }: { holding: Holding; onSave: (h: Holding) => void; onClose: () => void }) {
  const [ticker, setTicker] = useState(holding.ticker)
  const [name, setName] = useState(holding.name)
  const [shares, setShares] = useState(stripSymbol(holding.shares))
  const [price, setPrice] = useState(stripSymbol(holding.price))
  const symbol = holding.price.startsWith('¥') ? '¥' : '$'
  const numShares = Number(shares) || 0
  const numPrice = Number(price) || 0
  const value = symbol + (numShares * numPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })

  const save = () => {
    if (!ticker.trim() || !shares) return
    onSave({ ...holding, ticker: ticker.trim().toUpperCase(), name: name || ticker, shares, price: `${symbol}${Number(price).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, value })
  }

  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><div className="modal-kicker"><Pencil size={14} />EDIT HOLDING</div><h2>Edit holding</h2><p>Update the position details. Value is recalculated automatically.</p></div><button className="close-button" onClick={onClose}><X size={18} /></button></div><label className="api-key-field"><span>TICKER</span><input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="AAPL" /></label><label className="api-key-field"><span>NAME</span><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Apple Inc." /></label><div className="edit-grid"><label className="api-key-field"><span>SHARES</span><input type="number" value={shares} onChange={(e) => setShares(e.target.value)} inputMode="decimal" /></label><label className="api-key-field"><span>PRICE ({symbol})</span><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" /></label></div><div className="edit-value"><span>VALUE</span><strong>{value}</strong></div><div className="modal-footer"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={save} disabled={!ticker.trim() || !shares}>Save changes</button></div></div></div>
}

function ImporterModal({ apiKey, setApiKey, imageName, analyzing, extracted, error, fileRef, onFile, onAdd, onClose }: { apiKey: string; setApiKey: (value: string) => void; imageName: string; analyzing: boolean; extracted: ExtractedHolding[]; error: string; fileRef: React.RefObject<HTMLInputElement | null>; onFile: (file?: File) => void; onAdd: () => void; onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><div className="modal-kicker"><Sparkles size={14} />AI IMPORT</div><h2>Import from screenshot</h2><p>Folio AI will identify your holdings automatically.</p></div><button className="close-button" onClick={onClose}><X size={18} /></button></div><label className="api-key-field"><span>OpenRouter API key</span><input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="sk-or-v1-..." autoComplete="off" /><small>このブラウザ内に保存されます。共有端末では入力しないでください。</small></label><div className="dropzone" onClick={() => fileRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onFile(event.dataTransfer.files[0]) }}><input ref={fileRef} type="file" accept="image/*" hidden onChange={(event) => onFile(event.target.files?.[0])} />{analyzing ? <><div className="scan-animation"><Bot size={28} /></div><strong>Reading your screenshot...</strong><span>AI is looking for tickers, shares, and prices</span></> : imageName ? <><div className="file-icon"><FileImage size={26} /></div><strong>{imageName}</strong><span>Click to replace or drop another image</span></> : <><div className="upload-icon"><Upload size={22} /></div><strong>Drop a screenshot here</strong><span>or click to browse from your computer</span><small>PNG, JPG up to 10MB</small></>}</div>{imageName && !analyzing && <div className="import-preview"><div className="preview-check">✓</div><div><strong>Screenshot ready</strong><span>4 holdings detected · Review before adding</span></div><button className="remove-file" onClick={() => onFile(undefined)}><X size={15} /></button></div>}{error && <div className="import-error">{error}</div>}{extracted.length > 0 && <div className="extracted-list"><strong>{extracted.length}件の銘柄を検出しました</strong>{extracted.map((item) => <div className="extracted-row" key={item.ticker}><b>{item.ticker}</b><span>{item.name}</span><span>{item.shares}株</span><span>{item.currency === 'JPY' ? '¥' : '$'}{item.average_price}</span></div>)}</div>}<div className="modal-note"><div className="secure-icon">✦</div><span>Your image is processed securely and never used to train models.</span></div><div className="modal-footer"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={extracted.length === 0 || analyzing} onClick={onAdd}><Sparkles size={16} />ポートフォリオに追加</button></div></div></div>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
