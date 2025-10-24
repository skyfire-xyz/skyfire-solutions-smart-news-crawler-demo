import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { useEffect, useRef } from "react"

import {
  AlertDescription,
  AlertTitle,
  Alert as AlertUI,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { Alert, MessageData } from "../types"
import ShowTextButton from "./ShowTextButton"

type BadgeVariant = "default" | "success" | "destructive" | undefined

const getBadgeVariant = (status: string): BadgeVariant => {
  switch (status) {
    case "PAID":
      return "success"
    case "FREE":
      return "default"
    case "FAILED":
      return "destructive"
  }
}

interface CrawlLogProps {
  log: MessageData[]
  errorMessages: Alert[]
}

export default function CrawlLog({
  log,
  errorMessages,
}: CrawlLogProps) {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [log])

  return (
    <div className="h-full w-full">
      <div ref={logRef} className="h-full max-h-[500px] rounded-lg border border-gray-300 bg-gray-50 p-4 flex flex-col overflow-y-auto">
        <h2 className="mb-2 text-xl font-bold dark:text-white">
          Crawled Pages
        </h2>

        <ul className="flex-1">
          {[...log].reverse().map((entry, index) => {
            if (!entry.request.url) {
              return (
                <li
                  key={index}
                  className="mb-1.5 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getBadgeVariant("FAILED")}
                          className="text-xs px-2 py-0.5"
                        >
                          FAILED
                        </Badge>
                      </div>
                    </div>
                  </div>
                </li>
              )
            }
            return (
              <li
                key={index}
                className="mb-1.5 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex flex-col">
                    <span className="text-gray-800 dark:text-gray-400">
                      {entry.request.url}
                    </span>
                    <div className="flex items-center gap-2">
                      {(
                        <>
                        <span className="text-xs text-gray-500 dark:text-gray-300">
                          Total Charged: {entry.response.headers["x-payment-charged"] || "N/A"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-300">
                          Remaining Balance: {entry.response.headers["x-payment-session-remaining-balance"] || "N/A"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-300">
                          Pending Charges: {entry.response.headers["x-payment-session-accumulated-amount"] || "N/A"}
                        </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {entry.request.url && (
                  <ShowTextButton
                    request={{ headers: entry.request.headers, url: entry.request.url }}
                    response={{ headers: entry.response.headers, text: entry.response.text, url: entry.response.url }}
                  />
                )}
              </li>
            )
          })}
        </ul>

        {errorMessages.map((error, index) => (
          <AlertUI variant="destructive" key={index} className="mt-4">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </AlertUI>
        ))}
      </div>
    </div>
  )
}