import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Oxmon Web",
  description: "Web interface for Oxmon server monitoring",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
