
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ToastProvider'
import Navbar from '@/components/Navbar'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "One Rupee Game",
  description: "Win amazing prizes with One Rupee Game",
};

// layout.tsx
export default function RootLayout({
  children,
  hideNavbar = false
}: {
  children: React.ReactNode
  hideNavbar?: boolean
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {!hideNavbar && <Navbar />}
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
