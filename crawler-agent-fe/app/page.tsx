"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Pusher from "pusher-js"
import { v4 as uuidv4 } from "uuid"
import { MessageData } from "./types"
import CrawlSearchLog from "./components/CrawlSearchLog";
import NavTabs from "./components/NavTabs";
import TopBar from "./components/TopBar"
import PageLayout from "./components/PageLayout"

const channelId = uuidv4()

export default function App() {
  const [_currentSite, setCurrentSite] = useState<MessageData>()
  const [_summary, setSummary] = useState<MessageData>()
  const [_log, setLog] = useState<MessageData[]>([])
  const [_isMediumScreen, setIsMediumScreen] = useState(true)

  const searchParams = useSearchParams();
  const skyfireKyaToken = searchParams.get("token") || undefined;

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
    <>
    <TopBar />
    <PageLayout>
      <CrawlSearchLog skyfireKyaToken={skyfireKyaToken} />
    </PageLayout>
    </>
  )
}