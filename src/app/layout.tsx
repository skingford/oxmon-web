import type { Metadata } from 'next'
import { headers } from 'next/headers'
import localFont from 'next/font/local'
import './globals.css'
import { TooltipProvider } from '@/components/ui/tooltip'

const inter = localFont({
  src: [
    {
      path: './fonts/Inter-Latin.woff2',
      weight: '300 700',
      style: 'normal',
    },
  ],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Oxmon Admin',
  description: 'Infrastructure Monitoring & domains',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers()
  const locale = requestHeaders.get('x-current-locale') ?? 'en'

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
