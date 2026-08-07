import { Bell, Search } from 'lucide-react'

export function Topbar() {
  return (
    <header className="topbar">
      <div className="breadcrumbs"><span>Portfolio</span><span>/</span><strong>Overview</strong></div>
      <div className="top-actions">
        <div className="search"><Search size={16} /><input placeholder="Search holdings..." /></div>
        <button className="icon-button"><Bell size={18} /></button>
        <button className="avatar-small">U</button>
      </div>
    </header>
  )
}
