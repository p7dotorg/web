import type { Metadata } from "next"
import { Geist, Playfair_Display } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "p7 — Annotate academic papers",
  description: "Like Genius, but for papers.",
}

async function MaybeClerk({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { ClerkProvider } = await import("@clerk/nextjs")
    return <ClerkProvider>{children}</ClerkProvider>
  }
  return <>{children}</>
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <MaybeClerk>
      <html lang="en" className={`${geist.variable} ${playfair.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-black text-[#fcfdff]">{children}</body>
      </html>
    </MaybeClerk>
  )
}
