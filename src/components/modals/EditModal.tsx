import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { stripSymbol } from '../../lib/money'
import type { Holding } from '../../types'
import { ModalShell } from './ModalShell'

type EditModalProps = {
  holding: Holding
  onSave: (h: Holding) => void
  onClose: () => void
}

export function EditModal({ holding, onSave, onClose }: EditModalProps) {
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
    onSave({
      ...holding,
      ticker: ticker.trim().toUpperCase(),
      name: name || ticker,
      shares,
      price: `${symbol}${Number(price).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      value,
    })
  }

  return (
    <ModalShell kicker="EDIT HOLDING" icon={<Pencil size={14} />} title="Edit holding"
      desc="Update the position details. Value is recalculated automatically." onClose={onClose}>
      <label className="api-key-field">
        <span>TICKER</span>
        <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="AAPL" />
      </label>
      <label className="api-key-field">
        <span>NAME</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Apple Inc." />
      </label>
      <div className="edit-grid">
        <label className="api-key-field">
          <span>SHARES</span>
          <input type="number" value={shares} onChange={(e) => setShares(e.target.value)} inputMode="decimal" />
        </label>
        <label className="api-key-field">
          <span>PRICE ({symbol})</span>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
        </label>
      </div>
      <div className="edit-value"><span>VALUE</span><strong>{value}</strong></div>
      <div className="modal-footer">
        <button className="secondary-button" onClick={onClose}>Cancel</button>
        <button className="primary-button" onClick={save} disabled={!ticker.trim() || !shares}>Save changes</button>
      </div>
    </ModalShell>
  )
}
