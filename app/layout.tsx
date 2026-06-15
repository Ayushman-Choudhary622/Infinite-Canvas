import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'Vision Board',
  description: 'Infinite Canvas Mood Board',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* This script tells your app how to read Pinterest embed codes */}
        <Script 
          src="https://assets.pinterest.com/js/pinit.js" 
          strategy="lazyOnload" 
          data-pin-build="doBuild"
        />
      </body>
    </html>
  )
}
