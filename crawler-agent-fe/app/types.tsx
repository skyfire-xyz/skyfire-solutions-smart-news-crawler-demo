export const DEFAULT_DEPTH = "2"
export const DEFAULT_PAYMENT = "0.01"

export interface MessageData {
  type: string
  request: {url: string, headers: Record<string,string>,  method: string}, 
  response: {text: string, url: string, headers: Record<string,string>}, 
}

export enum AlertType {
  MISSING = "missing",
  INVALID = "invalid",
  INFO = "info",
  NETWORK = "network",
}

export type Alert = {
  type: AlertType
  message: string
}

export const AlertMessage = {
  MISSING_URL: "Please input a valid URL and try again.",
  BACKEND_DOWN:
    "Unable to reach the server. Please check your connection and try again",
  START_CRAWL: "Hang on tight! Crawl starting...",
} as const

export type AlertMessageType = keyof typeof AlertMessage