import { Plus } from 'lucide-react'
import { useState } from 'react'
import { symbolFor } from '../../lib/money'
import type { AddHoldingInput, Currency } from '../../types'
import { ModalShell } from './ModalShell'

type AddHoldingModalProps = {
  onAdd: (h: AddHoldingInput) => void
  onClose: () => void
}

export function AddHoldingModal({ onAdd, onClose }: AddHoldingModalProps) {
  const [currency, setCurrency] = useState<Currency>('USD')
  const [ticker, setTicker] = useState('')
  const [name, setName] = useState('')
  const [shares, setShares] = useState('')
  const [price, setPrice] = useState('')
  const symbol = symbolFor(currency)
  const numShares = Number(shares) || 0
  const numPrice = Number(price) || 0
  const value = symbol + (numShares * numPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })
  const valid = ticker.trim() && numShares > 0 && numPrice > 0
  const tone = currency === 'JPY' ? 'green' : 'blue'

  const save = () => {
    if (!valid) return
    onAdd({ ticker: ticker.trim().toUpperCase(), name: name.trim(), currency, shares: numShares, price: numPrice, tone })
  }

  return (
    <ModalShell kicker="ADD HOLDING" icon={<Plus size={14} />} title="Add holding"
      desc="Add a stock holding manually. Choose the market and fill in the details." onClose={onClose}>
      <div className="market-toggle">
        <button className={currency === 'USD' ? 'selected' : ''} onClick={() => setCurrency('USD')}><span className="flag">US</span>アメリカ</button>
        <button className={currency === 'JPY' ? 'selected' : ''} onClick={() => setCurrency('JPY')}><span className="flag">JP</span>日本</button>
      </div>
      <label className="api-key-field">
        <span>{currency === 'USD' ? 'TICKER' : '証券コード'}</span>
        <input type="text" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder={currency === 'USD' ? 'AAPL' : '7203'} />
      </label>
      <label className="api-key-field">
        <span>{currency === 'USD' ? 'NAME' : '銘柄名'}</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={currency === 'USD' ? 'Apple Inc.' : 'トヨタ自動車'} />
      </label>
      <div className="edit-grid">
        <label className="api-key-field">
          <span>{currency === 'USD' ? 'SHARES' : '株数'}</span>
          <input type="number" value={shares} onChange={(e) => setShares(e.target.value)} inputMode="decimal" placeholder="100" />
        </label>
        <label className="api-key-field">
          <span>PRICE ({symbol})</span>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="150.00" />
        </label>
      </div>
      <div className="edit-value"><span>VALUE</span><strong>{value}</strong></div>
      <div className="modal-footer">
        <button className="secondary-button" onClick={onClose}>Cancel</button>
        <button className="primary-button" onClick={save} disabled={!valid}><Plus size={16} />Add holding</button>
      </div>
    </ModalShell>
  )
}
