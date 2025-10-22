"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Pusher from "pusher-js"
import { v4 as uuidv4 } from "uuid"
import { MessageData } from "./types"
import CrawlSearchLog from "./components/CrawlSearchLog";

const channelId = uuidv4()

export default function App() {
  const [_currentSite, setCurrentSite] = useState<MessageData>()
  const [_summary, setSummary] = useState<MessageData>()
  const [_log, setLog] = useState<MessageData[]>([])
  const [_isMediumScreen, setIsMediumScreen] = useState(true)

  const searchParams = useSearchParams();
  const skyfireKyaPayToken = searchParams.get("token") || undefined;

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
    })

    const channel = pusher.subscribe(channelId)
    channel.bind("crawler-event", (data: { message: MessageData }) => {
      if (data.message !== undefined) {
        switch (data.message.type) {
          case "summary":
            setSummary(data.message)
            break
          case "error":
          case "page":
            setCurrentSite(data.message)
            setLog((prevLog) => [data.message, ...prevLog])
            break
        }
      }
    })
    return () => {
      pusher.unsubscribe(channelId)
    }
  }, [])

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMediumScreen(window.innerWidth >= 768)
    }

    checkScreenSize()
    window.addEventListener("resize", checkScreenSize)

    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="h-5" />
      <div className="container mx-auto px-4">
        <CrawlSearchLog skyfireKyaPayToken={skyfireKyaPayToken} />
      </div>
    </div>
  )
}
