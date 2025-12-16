"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface CrawlingContextType {
  isCrawling: boolean
  setIsCrawling: (value: boolean) => void
}

const CrawlingContext = createContext<CrawlingContextType | undefined>(undefined)

export function CrawlingProvider({ children }: { children: ReactNode }) {
  const [isCrawling, setIsCrawling] = useState(false)

  return (
    <CrawlingContext.Provider value={{ isCrawling, setIsCrawling }}>
      {children}
    </CrawlingContext.Provider>
  )
}

export function useCrawling() {
  const context = useContext(CrawlingContext)
  if (context === undefined) {
    throw new Error("useCrawling must be used within a CrawlingProvider")
  }
  return context
}

