import { Plus, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { formatAmount } from '../../lib/money'
import { ModalShell } from './ModalShell'

type CashModalProps = {
  usd: number
  jpy: number
  fxRate: number
  onSave: (usd: number, jpy: number) => void
  onClose: () => void
}

export function CashModal({ usd, jpy, fxRate, onSave, onClose }: CashModalProps) {
  const [usdInput, setUsdInput] = useState(usd ? String(usd) : '')
  const [jpyInput, setJpyInput] = useState(jpy ? String(jpy) : '')
  const numUsd = Number(usdInput) || 0
  const numJpy = Number(jpyInput) || 0

  const save = () => {
    onSave(numUsd, numJpy)
  }

  return (
    <ModalShell kicker="CASH" icon={<WalletCards size={14} />} title="Edit cash"
      desc="Set your available cash in each currency." onClose={onClose}>
      <div className="edit-grid">
        <label className="api-key-field">
          <span>CASH (USD $)</span>
          <input type="number" value={usdInput} onChange={(e) => setUsdInput(e.target.value)} inputMode="decimal" placeholder="0" />
        </label>
        <label className="api-key-field">
          <span>CASH (JPY ¥)</span>
          <input type="number" value={jpyInput} onChange={(e) => setJpyInput(e.target.value)} inputMode="decimal" placeholder="0" />
        </label>
      </div>
      <div className="edit-value">
        <span>CASH TOTAL (USD)</span>
        <strong>{formatAmount(numUsd + numJpy / fxRate, 'USD', 0)}</strong>
      </div>
      <div className="modal-footer" style={{ marginTop: 0 }}>
        <button className="secondary-button" onClick={onClose}>Cancel</button>
        <button className="primary-button" onClick={save}><Plus size={16} />Save cash</button>
      </div>
    </ModalShell>
  )
}
