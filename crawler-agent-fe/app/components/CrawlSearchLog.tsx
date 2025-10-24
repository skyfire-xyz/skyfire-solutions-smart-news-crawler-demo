import { useEffect, useState } from "react";
import Pusher from "pusher-js";
import { v4 as uuidv4 } from "uuid";
import CrawlLog from "./CrawlLog";
import SearchBar from "./SearchBar";
import { Alert, MessageData } from "../types";

interface CrawlSearchLogProps {
  skyfireKyaToken?: string;
}

const channelId = uuidv4();

export default function CrawlSearchLog({ skyfireKyaToken }: CrawlSearchLogProps) {
  const [currentSite, setCurrentSite] = useState<MessageData>();
  const [summary, setSummary] = useState<MessageData>();
  const [depth, setDepth] = useState<string | undefined>(undefined);
  const [payment, setPayment] = useState<string | undefined>(undefined);
  const [log, setLog] = useState<MessageData[]>([]);
  const [payments, setPayments] = useState<MessageData[]>([]);
  const [receipts, setReceipts] = useState<MessageData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const handleSearch = () => {
    setLog([]);
    setPayments([]);
    setReceipts([]);
    setAlerts([]);
    setSummary(undefined);
  };

  useEffect(() => {
    setDepth(undefined);
    setPayment(undefined);

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
    })

    const channel = pusher.subscribe(channelId);
    channel.bind("crawler-event", (data: { message: MessageData }) => {
      if (data.message !== undefined) {
        switch (data.message.type) {
          case "summary":
            setSummary(data.message);
            break;
          case "error":
          case "page":
            setCurrentSite(data.message);
            setLog((prevLog) => [data.message, ...prevLog]);
            break;
          case "payment":
            setPayments((prevPayments) => [data.message, ...prevPayments]);
            break;
          case "receipt":
            setReceipts((prevReceipts) => [data.message, ...prevReceipts]);
            break;
        }
      }
    });
    return () => {
      pusher.unsubscribe(channelId);
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Website URL Section with Border */}
      <div className="bg-blue-50 rounded-lg border border-gray-200 p-4 pb-0 shadow-sm">
        <div className="mb-4">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">Website URL</h2>
          <SearchBar
            onSearch={handleSearch}
            channelId={channelId}
            inputDepth={depth}
            inputPayment={payment}
            setAlerts={setAlerts}
            skyfireKyaToken={skyfireKyaToken}
          />
        </div>
      </div>

      {/* Crawled Pages Section */}
      <div className="bg-blue-50 rounded-lg border border-gray-200 p-3 shadow-sm">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">Crawled Pages</h2>
        {log.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">No pages crawled yet. Enter a URL and click Crawl to get started.</p>
          </div>
        ) : (
          <CrawlLog log={log} errorMessages={alerts} />
        )}
      </div>
    </div>
  );
} 