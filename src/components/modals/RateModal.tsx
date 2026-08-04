import { Settings } from 'lucide-react'
import { useState } from 'react'
import { ModalShell } from './ModalShell'

type RateModalProps = {
  fxRate: number
  setFxRate: (n: number) => void
  onClose: () => void
}

export function RateModal({ fxRate, setFxRate, onClose }: RateModalProps) {
  const [rate, setRate] = useState(String(fxRate))
  const numRate = Number(rate)
  const valid = numRate > 0

  const save = () => {
    if (!valid) return
    setFxRate(numRate)
    onClose()
  }

  return (
    <ModalShell kicker="EXCHANGE RATE" icon={<Settings size={14} />} title="USD/JPY rate"
      desc="Set how many yen one US dollar equals. Used to show total value in both currencies." onClose={onClose}>
      <label className="api-key-field">
        <span>1 USD = (JPY)</span>
        <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" autoFocus />
      </label>
      <div className="modal-footer" style={{ marginTop: 0 }}>
        <button className="secondary-button" onClick={onClose}>Cancel</button>
        <button className="primary-button" onClick={save} disabled={!valid}>Save rate</button>
      </div>
    </ModalShell>
  )
}
