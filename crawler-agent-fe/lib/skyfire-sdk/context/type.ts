import { AxiosError, AxiosResponse } from "axios"

type NetworkType =
  | "polygon_testnet"
  | "polygon_mainnet"
  | "coinbase_mainnet"
  | "coinbase_testnet"

// Wallet Data Response
interface Wallet {
  id: string
  userId: string
  walletName: string
  isDefault: boolean
  walletType: string
  network: NetworkType
  walletAddress: string
  createdDate: string
  updatedDate: string
}

interface OnchainBalance {
  total: string
}

interface EscrowBalance {
  total: string
  available: string
  allowance: string
}

interface Claims {
  sent: string
  received: string
}

interface NativeBalance {
  balance: string
}

interface Balance {
  address: string
  network: string
  isSmartAccount: boolean
  onchain: OnchainBalance
  escrow: EscrowBalance
  claims: Claims
  native: NativeBalance
}

export interface WalletDataResponse {
  wallet: Wallet
  balance: Balance
}

// PaymentClaim
type ClaimStatus = "SUCCESS" | "PENDING" | "FAILED"

export type PaymentClaim = {
  createdAt: string
  currency: string
  destinationAddress: string
  destinationName: string
  id: string
  network: NetworkType
  nonce: string
  referenceId: string
  signature: string
  sourceAddress: string
  sourceName: string
  status: ClaimStatus
  type: string
  updatedAt: string
  value: string
}

export type PaymentClaimResponse = {
  claims: PaymentClaim[]
}

export const FREQUENCY_TYPES = {
  PER_TRANSACTION: {
    type: "PER_TRANSACTION",
    displayName: "Per Transaction",
  },
  DAILY: { type: "DAILY", displayName: "Daily", days: 1 },
  SEVEN_DAY: { type: "SEVEN_DAY", displayName: "7 Day Rolling", days: 7 },
  THIRTY_DAY: { type: "THIRTY_DAY", displayName: "30 Day Rolling", days: 30 },
} as const

export type FrequencyType = keyof typeof FREQUENCY_TYPES

// Skyfire State
export interface Rule {
  id?: string
  type: "TRANSACTION" | "DURATION"
  amount: string
  targetWalletAddress?: string
  frequency?: FrequencyType
}

export interface Receiver {
  id: string
  username: string
  email: string
  isDynamicPricing: boolean
  walletAddress: string
}

// Skyfire State
export interface SkyfireState {
  localAPIKey: string | null
  isAPIKeyInitialized: boolean
  balance: Balance | null
  wallet: Wallet | null
  claims: PaymentClaim[] | null
  loading?: boolean
  error: AxiosError | null
  responses: AxiosResponse[]
  tosAgreed?: boolean
  rules: Rule[]
  receivers: Receiver[]
}
