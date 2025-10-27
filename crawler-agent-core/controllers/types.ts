import { IncomingHttpHeaders } from "http";

export const PAGE_MAX_LENGTH = 5000;
export const MAX_REQUESTS = 50;
export const MAX_DEPTH = 5;
export const DEFAULT_DEPTH = 5;
export const DEFAULT_REQUESTS = 100;
export const CRAWLER: string = "CrawlerAI";

export enum MessageType {
  PAGE = "page",
  SUMMARY = "summary",
  ERROR = "error",
}

export interface PageResult {
  type: MessageType;
  request: { url: string; headers: Record<string, string>; method: string };
  response: { text: string; url: string; headers: IncomingHttpHeaders };
  depth?: number;
  title?: string;
}

export interface CrawlResult {
  results: PageResult[];
  totalTimeSeconds: number;
  totalTraversalSizeBytes: number;
}
