import { Bot, FileImage, Plus, Sparkles, Upload, X } from 'lucide-react'
import { ASSET_ETF } from '../../constants'
import type { ExtractedHolding, Portfolio } from '../../types'
import { ModalShell } from './ModalShell'

type ImporterModalProps = {
  apiKey: string
  setApiKey: (k: string) => void
  imageName: string
  analyzing: boolean
  extracted: ExtractedHolding[]
  error: string
  fileRef: React.RefObject<HTMLInputElement | null>
  portfolios: Portfolio[]
  targetId: string
  lastPortfolio: string
  setTargetId: (id: string) => void
  onFile: (file?: File) => void
  onAdd: (targetId: string) => void
  onClose: () => void
}

export function ImporterModal({
  apiKey,
  setApiKey,
  imageName,
  analyzing,
  extracted,
  error,
  fileRef,
  portfolios,
  targetId,
  lastPortfolio,
  setTargetId,
  onFile,
  onAdd,
  onClose,
}: ImporterModalProps) {
  const target = targetId || lastPortfolio || portfolios[0]?.id || ''
  const targetName = portfolios.find((p) => p.id === target)?.name || 'portfolio'

  return (
    <ModalShell kicker="AI IMPORT" icon={<Sparkles size={14} />} title="Import from screenshot"
      desc="Folio AI will identify your holdings automatically." onClose={onClose}>
      {portfolios.length > 1 && (
        <label className="api-key-field">
          <span>ADD TO PORTFOLIO</span>
          <select className="pf-select" value={target} onChange={(e) => setTargetId(e.target.value)}>
            {portfolios.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      )}
      <label className="api-key-field">
        <span>OpenRouter API key</span>
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-or-v1-..." autoComplete="off" />
        <small>このブラウザ内に保存されます。共有端末では入力しないでください。</small>
      </label>
      <div
        className="dropzone"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]) }}
      >
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        {analyzing ? (
          <>
            <div className="scan-animation"><Bot size={28} /></div>
            <strong>Reading your screenshot...</strong>
            <span>AI is looking for tickers, shares, and prices</span>
          </>
        ) : imageName ? (
          <>
            <div className="file-icon"><FileImage size={26} /></div>
            <strong>{imageName}</strong>
            <span>Click to replace or drop another image</span>
          </>
        ) : (
          <>
            <div className="upload-icon"><Upload size={22} /></div>
            <strong>Drop a screenshot here</strong>
            <span>or click to browse from your computer</span>
            <small>PNG, JPG up to 10MB</small>
          </>
        )}
      </div>
      {imageName && !analyzing && (
        <div className="import-preview">
          <div className="preview-check">✓</div>
          <div><strong>Screenshot ready</strong><span>4 holdings detected · Review before adding</span></div>
          <button className="remove-file" onClick={() => onFile(undefined)}><X size={15} /></button>
        </div>
      )}
      {error && <div className="import-error">{error}</div>}
      {extracted.length > 0 && (
        <div className="extracted-list">
          <strong>{extracted.length}件の銘柄を検出しました</strong>
          {extracted.map((item) => (
            <div className="extracted-row" key={item.ticker}>
              <b>{ASSET_ETF[item.ticker] || item.ticker}</b>
              <span>{item.name}</span>
              <span>{item.shares != null ? `${item.shares}株` : '金額のみ'}</span>
              <span>
                {item.shares != null
                  ? `${item.currency === 'JPY' ? '¥' : '$'}${Number(item.average_price || 0).toLocaleString()}`
                  : item.amount != null
                    ? `¥${Number(item.amount).toLocaleString()}${item.percent != null ? ` (${item.percent}%)` : ''}`
                    : ''}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="modal-footer">
        <button className="secondary-button" onClick={onClose}>Cancel</button>
        <button className="primary-button" onClick={() => onAdd(target)} disabled={!extracted.length}>
          <Plus size={16} />Add to {targetName}
        </button>
      </div>
    </ModalShell>
  )
}
