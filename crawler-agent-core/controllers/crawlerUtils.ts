import Pusher from "pusher";
import { config } from "./config";
import { MessageType } from "./types";


export const pusher = new Pusher({
  appId: config.get("pusher.appId"),
  key: config.get("pusher.key"),
  secret: config.get("pusher.secret"),
  cluster: config.get("pusher.cluster"),
  useTLS: config.get("pusher.useTLS"),
});

export async function triggerCrawlEvent(
  data: unknown,
  channel: string = "crawler-channel",
  event: string = "crawler-event",
): Promise<void> {
  console.log(
    { data },
    `Triggering pusher event ${event} on channel ${channel} type ${(data as { message: { type: string } }).message.type}`,
  );
  await pusher.trigger(channel, event, data);
}

export async function triggerEndCrawlMessage({
  totalPagesCrawled,
  totalTimeSeconds,
  totalTraversalSizeBytes,
  channelId,
}: {
  totalPagesCrawled: number;
  totalTimeSeconds: number;
  channelId: string;
  totalTraversalSizeBytes: number;
}): Promise<void> {
  const receiptMessage = {
    message: {
      type: MessageType.SUMMARY,
      totalPagesCrawled: "" + totalPagesCrawled,
      totalTraversalSizeBytes: "" + totalTraversalSizeBytes,
      totalTimeSeconds: "" + totalTimeSeconds,
    },
  };
  await triggerCrawlEvent(receiptMessage, channelId);
}

export function encodeHTML(htmlString: string): string {
  return htmlString;
}
