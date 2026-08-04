import { ArrowDownToLine, Sparkles } from 'lucide-react'

type PageHeadingProps = {
  onImport: () => void
}

export function PageHeading({ onImport }: PageHeadingProps) {
  return (
    <section className="page-heading">
      <div>
        <p className="eyebrow">TUESDAY, JUNE 17, 2025 <span className="live-dot" />MARKET OPEN</p>
        <h1>Good morning, Tokutake <span>✦</span></h1>
        <p className="subheading">Here's how your portfolio is doing today.</p>
      </div>
      <div className="heading-actions">
        <button className="secondary-button"><ArrowDownToLine size={16} />Export</button>
        <button className="primary-button" onClick={onImport}><Sparkles size={16} />Import with AI</button>
      </div>
    </section>
  )
}
