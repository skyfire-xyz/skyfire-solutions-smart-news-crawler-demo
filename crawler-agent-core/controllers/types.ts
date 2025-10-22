import { IncomingHttpHeaders } from 'http'

export const PAGE_MAX_LENGTH = 5000
export const MAX_REQUESTS = 50
export const MAX_DEPTH = 5
export const DEFAULT_DEPTH = 5
export const DEFAULT_COST = 0.01
export const DEFAULT_REQUESTS = 100
export const CRAWLER: string = 'CrawlerAI'

export enum PaidStatus {
  PAID = 'PAID',
  PREV_PAID = 'PREVIOUSLY PAID',
  FREE = 'FREE',
  FAILED = 'FAILED'
}

export enum MessageType {
  PAGE = 'page',
  PAYMENT = 'payment',
  RECEIPT = 'receipt',
  SUMMARY = 'summary',
  ERROR = 'error'
}

export interface RobotsTxtData {
  paymentUrl: string
  siteUsername: string
  disallowedPaths: Set<string>
  paidContentPaths: Record<string, { claimId: string; amount: number }>
}

export interface PageResult {
  type: MessageType,
  request: {url: string, headers:Record<string, string>,  method:string}, 
  response: {text: string, url: string, headers: IncomingHttpHeaders}, 
  depth?: number,
  title?: string,
  paid?: PaidStatus
}

export interface CrawlResult {
  results: PageResult[]
  totalCost: number
  totalTimeSeconds: number
  totalTraversalSizeBytes: number
}