import Link from 'next/link'

export default function SiteHeader() {
  return (
    <header className="topbar-wrap">
      <div className="page-shell topbar">
        <Link href="/" className="brand-link">
          <img src="/mirofish-logo.jpeg" alt="MiroFish logo" className="brand-logo" />
          <div>
            <div className="brand-name">MIROFISH</div>
            <div className="brand-sub">Public Graph & Report Dashboard</div>
          </div>
        </Link>

        <nav className="topbar-actions">
          <Link href="/" className="topbar-link">공개 대시보드</Link>
          <Link href="/simulationadmin" className="topbar-link highlight">/simulationadmin</Link>
          <a href="https://github.com/666ghj/MiroFish" target="_blank" rel="noreferrer" className="topbar-link">Upstream ↗</a>
        </nav>
      </div>
    </header>
  )
}
