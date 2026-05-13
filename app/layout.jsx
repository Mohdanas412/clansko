// app/layout.jsx
// Root layout — wraps every page in ClanSko
// Sets the font, background color, and meta tags

import { Inter } from 'next/font/google'
import './globals.css'

// Load Inter font — the font from your design system
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

export const metadata = {
  title: 'ClanSko — For Serious Builder Students',
  description:
    'Find like-minded engineering students, discuss startup ideas, form teams, stay accountable.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}