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
    <div className="size-full">
      <div ref={logRef} className="flex h-full max-h-[500px] flex-col overflow-y-auto rounded-lg border border-gray-300 bg-blue-10 p-4">
        <ul className="flex-1">
          {[...log].reverse().map((entry, index) => {
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
                    <div className="flex items-center gap-1">
                      {entry.type === "error" ? (
                        <>
                        <Badge
                          variant="destructive"
                          className="px-2 py-0.5 text-xs"
                        >
                          ERROR
                        </Badge>
                        <span className="text-xs text-red-600 dark:text-red-400">
                          KYA token: Missing
                        </span>
                          </>
                      ) : (
                        <>
                          <Badge
                            variant="success"
                            className="px-2 py-0.5 text-xs"
                          >
                            SUCCESS
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-300">
                            KYA token: {entry.response.headers["x-identity-verified"] ? "Verified & Accepted" : "Not Required"}
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
            <ExclamationTriangleIcon className="size-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </AlertUI>
        ))}
      </div>
    </div>
  )
}