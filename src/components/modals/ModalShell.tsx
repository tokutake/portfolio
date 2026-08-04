import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type ModalShellProps = {
  kicker: string
  icon: ReactNode
  title: string
  desc: string
  onClose: () => void
  children: ReactNode
}

// すべてのモーダル共通の外枠（バックドロップ + ヘッダ）
export function ModalShell({ kicker, icon, title, desc, onClose, children }: ModalShellProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-kicker">{icon}{kicker}</div>
            <h2>{title}</h2>
            <p>{desc}</p>
          </div>
          <button className="close-button" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
