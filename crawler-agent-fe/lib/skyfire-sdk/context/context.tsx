"use client"

import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react"
import axios, { AxiosInstance, AxiosResponse, isAxiosError } from "axios"

import {
  SkyfireAction,
  addResponse,
  clearResponses,
  loading,
  replaceResponse,
  updateError,
  updateSkyfireAPIKey,
  updateSkyfireClaims,
  updateSkyfireRules,
  updateSkyfireWallet,
  updateTOSAgreement,
} from "@/lib/skyfire-sdk/context/action"

import { toast } from "../custom-shadcn/hooks/use-toast"
import { initialState, skyfireReducer } from "./reducer"
import { PaymentClaim, SkyfireState } from "./type"

declare module "axios" {
  export interface AxiosRequestConfig {
    metadataForAgent?: {
      title?: string
      useWithChat?: boolean
      correspondingPageURLs: string[]
      customizeResponse?: (response: AxiosResponse) => AxiosResponse
      customPrompts: string[]
      replaceExisting?: boolean
    }
  }
}
interface SkyfireContextType {
  state: SkyfireState
  dispatch: React.Dispatch<SkyfireAction>
  apiClient: AxiosInstance | null
  logout: () => void
  pushResponse: (response: AxiosResponse) => void
  replaceExistingResponse: (response: AxiosResponse) => void
  resetResponses: () => void
  getClaimByReferenceID: (referenceId: string | null) => Promise<boolean>
  fetchAndCompareClaims: () => Promise<void>
}

export const getItemNamesFromResponse = (response: AxiosResponse): string => {
  const config = response.config
  const title = config.metadataForAgent?.title || config.url || "Unknown"
  return title
}

const SkyfireContext = createContext<SkyfireContextType | undefined>(undefined)

export const SkyfireProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(skyfireReducer, initialState)
  const previousClaimsRef = useRef<PaymentClaim[] | null>(state.claims)

  // Create a memoized Axios instance
  const apiClient = useMemo(() => {
    if (!state.localAPIKey) return null
    const instance = axios.create({
      baseURL:
        process.env.NEXT_PUBLIC_SKYFIRE_API_URL || "https://api.skyfire.xyz",
    })

    // Request interceptor
    instance.interceptors.request.use(
      (config) => {
        config.headers["skyfire-api-key"] = state.localAPIKey
        if (config.url?.includes("start-crawler")) {
          dispatch(loading(true))
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    instance.interceptors.response.use(
      async (response) => {
        if (response.config.metadataForAgent?.useWithChat) {
          if (response.config.metadataForAgent?.customizeResponse) {
            if (response.config.metadataForAgent?.replaceExisting) {
              replaceExistingResponse(
                response.config.metadataForAgent?.customizeResponse(response)
              )
            } else {
              pushResponse(
                response.config.metadataForAgent?.customizeResponse(response)
              )
            }
          } else {
            if (response.config.metadataForAgent?.replaceExisting) {
              replaceExistingResponse(response)
            } else {
              pushResponse(response)
            }
          }
        }

        // Can Process Payment Here
        setTimeout(() => {
          dispatch(loading(false))
          if (response.config.url?.includes("start-crawl")) {
            fetchAndCompareClaims()
          }
        }, 500)
        return response
      },
      (error) => {
        dispatch(loading(false))
        if (error.response && error.response.status === 401) {
          // Handle unauthorized access
          logout()
        }
        if (error.response.config.url?.includes("start-crawl")) {
          fetchAndCompareClaims()
        }
        return Promise.reject(error)
      }
    )

    return instance
  }, [state.localAPIKey])

  useEffect(() => {

    const tosAgreed = localStorage.getItem("tosAgreed")
    if (tosAgreed !== null) {
      dispatch(updateTOSAgreement(JSON.parse(tosAgreed)))
    }
  }, [])

  const fetchAndCompareClaims = async () => {
    if (!apiClient) return

    try {
      const response = await apiClient.get("/v1/wallet/claims")
      const newClaims = response.data.claims
      const previousClaims = previousClaimsRef.current || []

      if (Array.isArray(newClaims)) {
        const previousClaimsSet = new Set(
          previousClaims.map((claim) => claim.id)
        )

        const spent = newClaims.reduce((acc, claim) => {
          if (!previousClaimsSet.has(claim.id)) {
            return acc + Number(claim.value)
          }
          return acc
        }, 0)
        if (spent > 0) {
          toast({
            title: `Spent ${spent}`,
            duration: 3000,
          })
        }
        previousClaimsRef.current = newClaims
      } else {
        console.error("Unexpected data format for claims:", newClaims)
      }
    } catch (error) {
      console.error("Error fetching claims:", error)
    }
    await fetchUserBalance()
  }

  async function fetchReceivers() {
    if (apiClient) {
      try {
        const res = await apiClient.get("/v1/users/receivers/list")
        dispatch(updateSkyfireWallet(res.data))
      } catch (e) {
        if (isAxiosError(e)) {
          dispatch(updateError(e))
        }
      }
    }
  }

  async function fetchUserRules() {
    if (apiClient) {
      try {
        const res = await apiClient.get("/v1/users/rules")
        dispatch(updateSkyfireRules(res.data))
      } catch (e) {
        if (isAxiosError(e)) {
          dispatch(updateError(e))
        }
      }
    }
  }

  async function fetchUserBalance() {
    if (apiClient) {
      try {
        const res = await apiClient.get("/v1/wallet/balance")
        dispatch(updateSkyfireWallet(res.data))
      } catch (e) {
        if (isAxiosError(e)) {
          dispatch(updateError(e))
        }
      }
    }
  }

  async function fetchUserClaims() {
    if (apiClient) {
      try {
        const res = await apiClient.get("/v1/wallet/claims")
        previousClaimsRef.current = res.data.claims
        dispatch(updateSkyfireClaims(res.data))
      } catch (e: unknown) {
        if (isAxiosError(e)) {
          dispatch(updateError(e))
        }
      }
    }
  }

  async function getClaimByReferenceID(referenceId: string | null) {
    if (!referenceId || !apiClient) {
      return false
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
    try {
      const res = await apiClient.get(
        `v1/wallet/claimByReferenceId/${referenceId}`
      )
    } catch (error) {
      console.error("Error fetching claim:", error)
    }

    return false
  }

  function logout() {
    dispatch(updateSkyfireAPIKey(null))
  }

  function pushResponse(response: AxiosResponse) {
    dispatch(addResponse(response))
  }

  function replaceExistingResponse(response: AxiosResponse) {
    dispatch(replaceResponse(response))
  }

  function resetResponses() {
    dispatch(clearResponses())
  }

  useEffect(() => {
    if (apiClient) {
      fetchUserBalance()
      fetchUserClaims()
      fetchUserRules()
      fetchReceivers()
    }
  }, [apiClient])

  return (
    <SkyfireContext.Provider
      value={{
        state,
        dispatch,
        apiClient,
        logout,
        pushResponse,
        replaceExistingResponse,
        resetResponses,
        getClaimByReferenceID,
        fetchAndCompareClaims,
      }}
    >
      {children}
    </SkyfireContext.Provider>
  )
}

export const useSkyfire = () => {
  const context = useContext(SkyfireContext)
  if (!context) {
    throw new Error("useSkyfire must be used within a SkyfireProvider")
  }
  return context
}

export const useSkyfireState = () => {
  const context = useContext(SkyfireContext)
  if (!context) {
    throw new Error("useSkyfire must be used within a SkyfireProvider")
  }
  return context.state
}

export const useSkyfireAPIKey = () => {
  const { state } = useSkyfire()

  return {
    localAPIKey: state?.localAPIKey,
    isReady: state?.isAPIKeyInitialized,
  }
}

export const useSkyfireAPIClient = () => {
  const { state, apiClient } = useSkyfire()
  if (!state.localAPIKey) return null
  return apiClient
}

export const useLoadingState = () => {
  const { state } = useSkyfire()
  return state?.loading
}

export const useSkyfireResponses = (pathname: string) => {
  const { state } = useSkyfire()
  if (state?.responses.length > 0) {
    return filterResponsesByUrl(state?.responses, pathname)
  }
  return state?.responses
}

export const useSkyfireRules = () => {
  const { state } = useSkyfire()
  return state?.rules
}

export const useSkyfireRuleById = (ruleId: string) => {
  const { state } = useSkyfire()
  return state?.rules.find((rule) => rule.id === ruleId)
}

export const useSkyfireReceivers = () => {
  const { state } = useSkyfire()
  return state?.receivers
}

function isUrlMatch(pathname: string, urlPatterns: string[]): boolean {
  return urlPatterns.some((pattern) => {
    // Convert the URL pattern to a regex
    const regexPattern = pattern.replace(/\[.*?\]/g, "[^/]+")
    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(pathname)
  })
}

function filterResponsesByUrl(
  responses: AxiosResponse[],
  pathname: string
): AxiosResponse[] {
  return responses.filter((response) => {
    const urls = response.config.metadataForAgent?.correspondingPageURLs || []
    return isUrlMatch(pathname, urls)
  })
}

// Add a new hook to easily access and update the TOS agreement state
export const useSkyfireTOSAgreement = () => {
  const { state, dispatch } = useSkyfire()

  const setTOSAgreement = (agreed: boolean) => {
    dispatch(updateTOSAgreement(agreed))
  }

  return {
    tosAgreed: state.tosAgreed,
    setTOSAgreement,
  }
}
