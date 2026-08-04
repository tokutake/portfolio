import { ArrowUpRight, BarChart3, Settings, WalletCards } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatAmount } from '../lib/money'

type TotalMetricProps = {
  usd: number
  jpy: number
  fxRate: number
  onRate: () => void
}

export function TotalMetric({ usd, jpy, fxRate, onRate }: TotalMetricProps) {
  const fmtUsd = (n: number) => formatAmount(n, 'USD', 0)
  const fmtJpy = (n: number) => formatAmount(n, 'JPY', 0)
  return (
    <div className="metric-card total-card">
      <div className="metric-top">
        <span>Total portfolio value</span>
        <button className="rate-button" onClick={onRate} title="Edit exchange rate">1$ = ¥{fxRate} <Settings size={13} /></button>
      </div>
      <strong className="metric-value">{fmtUsd(usd)}</strong>
      <div className="metric-foot">
        <span className="positive">{fmtJpy(jpy)}</span>
        <span className="percent-pill">USD/JPY</span>
      </div>
    </div>
  )
}

type MetricProps = {
  label: string
  value: string
  change: string
  percent: string
  icon: ReactNode
  positive?: boolean
}

export function Metric({ label, value, change, percent, icon, positive }: MetricProps) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <div className="metric-icon">{icon}</div>
      </div>
      <strong className="metric-value">{value}</strong>
      <div className="metric-foot">
        <span className={positive ? 'positive' : ''}>{change}</span>
        {percent && <span className="percent-pill">{percent}</span>}
      </div>
    </div>
  )
}

// Overview の4枚のメトリクスカードをまとめて描画
type MetricsProps = {
  usd: number
  jpy: number
  fxRate: number
  cashUsd: number
  cashJpy: number
  onRate: () => void
}

export function Metrics({ usd, jpy, fxRate, cashUsd, cashJpy, onRate }: MetricsProps) {
  return (
    <section className="metrics-grid">
      <TotalMetric usd={usd} jpy={jpy} fxRate={fxRate} onRate={onRate} />
      <Metric label="Today’s return" value="+$1,204.82" change="Since market open" percent="+2.04%" icon={<BarChart3 size={18} />} positive />
      <Metric label="Total return" value="+$12,486.90" change="Since inception" percent="+26.12%" icon={<ArrowUpRight size={18} />} positive />
      <Metric
        label="Cash available"
        value={formatAmount(cashUsd, 'USD', 2)}
        change={formatAmount(cashJpy, 'JPY', 0)}
        percent=""
        icon={<WalletCards size={18} />}
      />
    </section>
  )
}
