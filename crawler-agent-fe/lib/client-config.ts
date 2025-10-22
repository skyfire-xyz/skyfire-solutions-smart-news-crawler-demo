interface ClientConfig {
  name: string
  logo?: string
  logoSize?: { width: number; height: number }
  skyfireLogo: string
  mode: "default" // Custom theme modes
  requiresAuth?: boolean
}

interface ClientConfigs {
  [domain: string]: ClientConfig
}

export const clientConfigs: ClientConfigs = {
  default: {
    name: "Skyfire Crawler (Combined)",
    skyfireLogo: "/skyfire-logo.svg",
    mode: "default",
    requiresAuth: true,
  },
}

export function getClientConfig(hostname: string): ClientConfig {
  const parts = hostname.split(".")
  const subdomain = parts[0]

  if (subdomain === "crawler") {
    return clientConfigs.default
  }

  return clientConfigs[subdomain] || clientConfigs.default
}
