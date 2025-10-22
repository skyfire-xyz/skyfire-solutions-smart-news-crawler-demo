import "@/styles/globals.css"
import { Metadata } from "next"
import { headers } from "next/headers"
import { GoogleAnalytics } from "@next/third-parties/google"
import { ToastContainer } from "react-toastify"

import { siteConfig } from "@/config/site"
import { ClientProvider } from "@/lib/client-context"
import { fontSans } from "@/lib/fonts"
import { SkyfireProvider } from "@/lib/skyfire-sdk/context/context"
import { cn } from "@/lib/utils"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"

import "react-toastify/dist/ReactToastify.css"
import { getClientConfig } from "@/lib/client-config"

import NavTabs from "./components/NavTabs"
import TopBar from "./components/TopBar"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const headersList = headers()
  const hostname = headersList.get("host") || "default"
  const domain = hostname.split(".")[0]

  const clientConfig = getClientConfig(hostname)

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-white font-sans antialiased",
          fontSans.variable
        )}
      >
        <GoogleAnalytics gaId="G-7VNTRGW711" />
        <ClientProvider hostname={domain}>
          <ThemeProvider
            attribute="class"
            defaultTheme="default"
            forcedTheme={clientConfig?.mode || "default"}
            enableSystem={false}
          >
            <SkyfireProvider>
              <div className="relative flex min-h-screen flex-col ml-5">
                <TopBar />
                <NavTabs />

                <div className="flex-1">{children}</div>
              </div>
              <TailwindIndicator />
              <ToastContainer />
            </SkyfireProvider>
          </ThemeProvider>
        </ClientProvider>
      </body>
    </html>
  )
}
