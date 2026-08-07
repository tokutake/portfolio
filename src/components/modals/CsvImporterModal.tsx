import { FileSpreadsheet, Upload, X } from 'lucide-react'
import type { Portfolio } from '../../types'
import type { CsvHolding } from '../../lib/csvImport'
import { ModalShell } from './ModalShell'

type CsvImporterModalProps = {
  fileName: string
  holdings: CsvHolding[]
  errors: string[]
  portfolios: Portfolio[]
  targetId: string
  lastPortfolio: string
  setTargetId: (id: string) => void
  fileRef: React.RefObject<HTMLInputElement | null>
  onFile: (file?: File) => void
  onAdd: (targetId: string) => void
  onClose: () => void
}

export function CsvImporterModal({
  fileName,
  holdings,
  errors,
  portfolios,
  targetId,
  lastPortfolio,
  setTargetId,
  fileRef,
  onFile,
  onAdd,
  onClose,
}: CsvImporterModalProps) {
  const target = targetId || lastPortfolio || portfolios[0]?.id || ''
  const targetName = portfolios.find((p) => p.id === target)?.name || 'portfolio'

  return (
    <ModalShell kicker="CSV IMPORT" icon={<FileSpreadsheet size={14} />} title="CSVから取り込み" desc="証券会社の取引履歴CSVを選択してください。" onClose={onClose}>
      {portfolios.length > 1 && (
        <label className="api-key-field">
          <span>ADD TO PORTFOLIO</span>
          <select className="pf-select" value={target} onChange={(e) => setTargetId(e.target.value)}>
            {portfolios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div
        className="dropzone"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          onFile(e.dataTransfer.files[0])
        }}
      >
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        {fileName ? (
          <>
            <div className="file-icon">
              <FileSpreadsheet size={26} />
            </div>
            <strong>{fileName}</strong>
            <span>クリックまたはドロップで差し替え</span>
          </>
        ) : (
          <>
            <div className="upload-icon">
              <Upload size={22} />
            </div>
            <strong>CSVをドロップ</strong>
            <span>またはクリックしてファイルを選択</span>
            <small>対応ヘッダー: ticker, 銘柄コード, shares/株数, price/取得単価, currency/通貨 など</small>
          </>
        )}
      </div>

      {fileName && (
        <div className="import-preview">
          <div className="preview-check">✓</div>
          <div>
            <strong>CSV読み込み済み</strong>
            <span>
              {holdings.length}件有効{errors.length ? ` · ${errors.length}件エラー` : ''} · 追加前に確認してください
            </span>
          </div>
          <button className="remove-file" onClick={() => onFile(undefined)}>
            <X size={15} />
          </button>
        </div>
      )}

      {errors.length > 0 && <div className="import-error">{errors.join('\n')}</div>}

      {holdings.length > 0 && (
        <div className="extracted-list">
          <strong>{holdings.length}件の銘柄を検出しました</strong>
          {holdings.map((h) => (
            <div className="extracted-row" key={`${h.ticker}-${h.shares}-${h.price}`}>
              <b>{h.ticker}</b>
              <span>{h.name}</span>
              <span>
                {h.shares}株 · {h.currency === 'JPY' ? '¥' : '$'}
                {h.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="modal-footer">
        <button className="secondary-button" onClick={onClose}>
          Cancel
        </button>
        <button className="primary-button" onClick={() => onAdd(target)} disabled={!holdings.length}>
          Add to {targetName}
        </button>
      </div>
    </ModalShell>
  )
}
