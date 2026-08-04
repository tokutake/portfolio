import { ArrowUpRight, MoreHorizontal } from 'lucide-react'
import { ALLOCATION } from '../constants'

// パフォーマンスとアロケーションの静的ダッシュボードパネル
export function DashboardPanels() {
  return (
    <div className="dashboard-grid">
      <section className="panel performance-panel">
        <div className="panel-heading">
          <div>
            <h2>Portfolio performance</h2>
            <p>Track your portfolio value over time</p>
          </div>
          <div className="range-tabs">
            <button>1W</button><button>1M</button><button className="selected">3M</button><button>1Y</button><button>ALL</button>
          </div>
        </div>
        <div className="chart-wrap">
          <div className="chart-y"><span>$65k</span><span>$60k</span><span>$55k</span><span>$50k</span><span>$45k</span></div>
          <svg viewBox="0 0 720 250" preserveAspectRatio="none" className="chart">
            <defs>
              <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4264e8" stopOpacity=".2" />
                <stop offset="100%" stopColor="#4264e8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,214 C28,208 45,210 62,192 S99,174 118,186 S148,161 175,169 S209,149 226,154 S255,122 280,134 S316,115 337,121 S360,95 390,104 S425,79 446,89 S475,63 504,72 S538,45 564,56 S597,31 625,46 S657,26 681,32 S708,18 720,20 L720,250 L0,250Z" fill="url(#area)" />
            <path d="M0,214 C28,208 45,210 62,192 S99,174 118,186 S148,161 175,169 S209,149 226,154 S255,122 280,134 S316,115 337,121 S360,95 390,104 S425,79 446,89 S475,63 504,72 S538,45 564,56 S597,31 625,46 S657,26 681,32 S708,18 720,20" fill="none" stroke="#4264e8" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div className="chart-x"><span>Mar 17</span><span>Apr 01</span><span>Apr 15</span><span>May 01</span><span>May 15</span><span>Jun 01</span><span>Jun 17</span></div>
        </div>
      </section>

      <section className="panel allocation-panel">
        <div className="panel-heading">
          <div>
            <h2>Allocation</h2>
            <p>Where your money is invested</p>
          </div>
          <button className="more-button"><MoreHorizontal size={18} /></button>
        </div>
        <div className="donut-area">
          <div className="donut">
            <div className="donut-hole"><strong>88%</strong><span>Invested</span></div>
          </div>
          <div className="legend">
            {ALLOCATION.map((item) => (
              <div className="legend-row" key={item.label}>
                <span className="legend-swatch" style={{ background: item.color }} />
                <span>{item.label}</span>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>
        </div>
        <button className="text-button">View allocation details <ArrowUpRight size={14} /></button>
      </section>
    </div>
  )
}
