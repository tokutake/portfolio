import { Plus } from 'lucide-react'
import { useState } from 'react'
import { ModalShell } from './ModalShell'

type AddPortfolioModalProps = {
  onAdd: (name: string) => void
  onClose: () => void
}

export function AddPortfolioModal({ onAdd, onClose }: AddPortfolioModalProps) {
  const [name, setName] = useState('')
  const valid = name.trim().length > 0

  const save = () => {
    if (!valid) return
    onAdd(name)
  }

  return (
    <ModalShell kicker="NEW PORTFOLIO" icon={<Plus size={14} />} title="Add portfolio"
      desc="Create a new portfolio to manage separately." onClose={onClose}>
      <label className="api-key-field">
        <span>PORTFOLIO NAME</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 日本株" autoFocus />
      </label>
      <div className="modal-footer" style={{ marginTop: 0 }}>
        <button className="secondary-button" onClick={onClose}>Cancel</button>
        <button className="primary-button" onClick={save} disabled={!valid}>Create</button>
      </div>
    </ModalShell>
  )
}
