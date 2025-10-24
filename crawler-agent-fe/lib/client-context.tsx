"use client"

import { ReactNode, createContext, useContext } from "react"

import { getClientConfig } from "./client-config"

const ClientContext = createContext<ReturnType<typeof getClientConfig>>(
  getClientConfig("default")
)

export function ClientProvider({
  children,
  hostname,
}: {
  children: ReactNode
  hostname: string
}) {
  const config = getClientConfig(hostname)

  return (
    <ClientContext.Provider value={config}>{children}</ClientContext.Provider>
  )
}

export function useClientConfig() {
  return useContext(ClientContext)
}
