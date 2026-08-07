import {
  ArrowUpRight,
  BarChart3,
  Bell,
  CircleHelp,
  FileSpreadsheet,
  Home,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Settings,
  WalletCards,
  X,
} from 'lucide-react'
import type { Portfolio } from '../types'

type NavTab = 'overview' | 'holdings'

type SidebarProps = {
  portfolios: Portfolio[]
  activeId: string
  holdingsCount: number
  active: NavTab
  onSelectPortfolio: (id: string) => void
  onShowTab: (tab: NavTab) => void
  onCsvImport: () => void
  onAddPortfolio: () => void
  onRemovePortfolio: (id: string) => void
}

export function Sidebar({
  portfolios,
  activeId,
  holdingsCount,
  active,
  onSelectPortfolio,
  onShowTab,
  onCsvImport,
  onAddPortfolio,
  onRemovePortfolio,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><BarChart3 size={17} strokeWidth={2.7} /></div>
        <span>folio</span>
      </div>

      <div className="portfolio-select">
        <button
          className={activeId === 'all' ? 'portfolio-item all active' : 'portfolio-item all'}
          onClick={() => onSelectPortfolio('all')}
        >
          <span className="pf-ico"><LayoutGrid size={14} /></span>
          <span><strong>Total</strong><small>{portfolios.length} portfolio</small></span>
        </button>
        {portfolios.map((p) => (
          <div className="portfolio-row" key={p.id}>
            <button
              className={activeId === p.id ? 'portfolio-item active' : 'portfolio-item'}
              onClick={() => onSelectPortfolio(p.id)}
            >
              <span className="pf-ico">{(p.name || 'P').slice(0, 1).toUpperCase()}</span>
              <span><strong>{p.name}</strong><small>{p.holdings.length} holdings</small></span>
            </button>
            {portfolios.length > 1 && (
              <button className="pf-del" onClick={() => onRemovePortfolio(p.id)} title="Remove portfolio">
                <X size={13} />
              </button>
            )}
          </div>
        ))}
        <button className="pf-add" onClick={onAddPortfolio}><Plus size={14} />Add portfolio</button>
      </div>

      <nav className="nav">
        <p className="nav-label">WORKSPACE</p>
        <button className={active === 'overview' ? 'nav-item active' : 'nav-item'} onClick={() => onShowTab('overview')}>
          <Home size={17} />Overview
        </button>
        <button className={active === 'holdings' ? 'nav-item active' : 'nav-item'} onClick={() => onShowTab('holdings')}>
          <WalletCards size={17} />Holdings <span className="nav-count">{holdingsCount}</span>
        </button>
        <button className="nav-item" onClick={onCsvImport}>
          <FileSpreadsheet size={17} />CSV Import
        </button>
        <button className="nav-item"><LayoutGrid size={17} />Allocation</button>
        <p className="nav-label second">TOOLS</p>
        <button className="nav-item"><BarChart3 size={17} />Performance</button>
        <button className="nav-item"><Bell size={17} />Alerts <span className="alert-dot" /></button>
      </nav>

      <div className="sidebar-bottom">
        <button className="nav-item"><Settings size={17} />Settings</button>
        <button className="nav-item"><CircleHelp size={17} />Help center</button>
        <div className="upgrade-card">
          <div className="upgrade-icon"><FileSpreadsheet size={15} /></div>
          <strong>Make smarter moves</strong>
          <span>Unlock advanced insights with folio Pro.</span>
          <button>Explore Pro <ArrowUpRight size={13} /></button>
        </div>
        <div className="profile">
          <div className="profile-avatar">U</div>
          <div><strong>User</strong><small>Free plan</small></div>
          <MoreHorizontal size={17} />
        </div>
      </div>
    </aside>
  )
}
