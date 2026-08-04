import { MoreHorizontal, Pencil, Plus, RefreshCw, WalletCards } from 'lucide-react'
import { formatAmount, parseMoney } from '../lib/money'
import type { Holding } from '../types'

type HoldingsTableProps = {
  holdings: Holding[]
  fxRate: number
  isAll: boolean
  currentName: string
  valueSort: 'asc' | 'desc' | null
  updating: boolean
  onSortToggle: () => void
  onRefresh: () => void
  onCash: () => void
  onAdd: () => void
  onEdit: (holding: Holding) => void
  onRemove: (ticker: string) => void
}

export function HoldingsTable({
  holdings,
  fxRate,
  isAll,
  currentName,
  valueSort,
  updating,
  onSortToggle,
  onRefresh,
  onCash,
  onAdd,
  onEdit,
  onRemove,
}: HoldingsTableProps) {
  return (
    <section className="panel holdings-panel">
      <div className="panel-heading">
        <div>
          <h2>Your holdings <span className="count-badge">{holdings.length}</span></h2>
          <p>Positions in {isAll ? 'all portfolios' : currentName}</p>
        </div>
        <div className="holding-actions">
          <button className="ghost-button" onClick={onRefresh} disabled={updating}>
            <RefreshCw size={15} />{updating ? '更新中…' : 'Update prices'}
          </button>
          <button className="ghost-button" onClick={onCash}><WalletCards size={15} />Cash</button>
          <button className="add-button" onClick={onAdd}><Plus size={16} />Add holding</button>
        </div>
      </div>

      <div className="table">
        <div className="table-head">
          <span>ASSET</span>
          <span>SHARES</span>
          <span>PRICE</span>
          <button className="sort-head" onClick={onSortToggle}>
            VALUE {valueSort ? (valueSort === 'desc' ? '↓' : '↑') : ''}
          </button>
          <span>RETURN</span>
          <span />
        </div>
        {holdings.map((holding, index) => {
          const mv = parseMoney(holding.value)
          // 表示は全銘柄で「円→ドル」の順に統一（日本株と同じ並び）
          const isJpy = mv.currency === 'JPY'
          const jpyAmount = isJpy ? mv.amount : mv.amount * fxRate
          const usdAmount = isJpy ? mv.amount / fxRate : mv.amount
          const jpyStr = formatAmount(jpyAmount, 'JPY', 0)
          const usdStr = formatAmount(usdAmount, 'USD', 0)
          return (
            <div className="table-row" key={index}>
              <div className="asset-cell">
                <div className={`ticker-logo ${holding.tone}`}>{holding.ticker.slice(0, 1)}</div>
                <div><strong>{holding.ticker}</strong><small>{holding.name}</small></div>
              </div>
              <span>{holding.shares}</span>
              <span>{holding.price}</span>
              <div className="value-cell">
                <strong>{jpyStr}</strong>
                <small>{usdStr}</small>
              </div>
              <span className="positive">{holding.change}</span>
              <div className="row-actions">
                <button className="row-menu" onClick={() => onEdit(holding)} title="Edit holding"><Pencil size={15} /></button>
                <button className="row-menu" onClick={() => onRemove(holding.ticker)} title="Remove holding"><MoreHorizontal size={17} /></button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
