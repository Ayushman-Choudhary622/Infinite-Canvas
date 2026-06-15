import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
