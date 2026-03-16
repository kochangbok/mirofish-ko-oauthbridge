import './globals.css'
import SiteHeader from '@/components/site-header'

export const metadata = {
  title: 'MiroFish Public Reports Dashboard',
  description: 'Public report hub and admin submission portal for MiroFish simulation reports.'
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <div className="backdrop-orb orb-a" />
        <div className="backdrop-orb orb-b" />
        <SiteHeader />
        {children}
      </body>
    </html>
  )
}
