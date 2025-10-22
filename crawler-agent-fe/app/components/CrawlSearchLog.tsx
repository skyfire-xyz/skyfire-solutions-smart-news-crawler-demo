import { useEffect, useState } from "react";
import Pusher from "pusher-js";
import { v4 as uuidv4 } from "uuid";
import CrawlLog from "./CrawlLog";
import SearchBar from "./SearchBar";
import { Alert, MessageData } from "../types";

interface CrawlSearchLogProps {
  skyfireKyaPayToken?: string;
}

const channelId = uuidv4();

export default function CrawlSearchLog({ skyfireKyaPayToken }: CrawlSearchLogProps) {
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
    <div>
      <div className="md:relative flex-col items-center justify-center mb-8">
        <SearchBar
          onSearch={handleSearch}
          channelId={channelId}
          inputDepth={depth}
          inputPayment={payment}
          setAlerts={setAlerts}
          skyfireKyaPayToken={skyfireKyaPayToken}
        />
      </div>
        <div className="md:col-span-2">
          <CrawlLog log={log} errorMessages={alerts} />
        </div>
    </div>
  );
} 