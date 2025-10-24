// src/utils/logger.ts

import dotenv from "dotenv";
dotenv.config();

import tracer from "../lib/dd-agent";
import { Request, Response, NextFunction } from "express";
import pino from "pino";

const ddEnabled = process.env.DD_ENABLED === "true";
const apiKey = process.env.DD_API_KEY!;
const ddOptions = {
  api_key: apiKey, // <-- use api_key, not apiKey
  ddsource: "nodejs",
  service: "skyfire-solutions-crawler-bot-protection-proxy",
  ddtags: `env:${process.env.DD_ENV || "dev"}`,
};

if (apiKey && ddEnabled) {
  // eslint-disable-next-line no-console
  console.log(
    "[Logger] Datadog logging is ENABLED: logs will be sent to Datadog."
  );
}

const env = process.env.DD_ENV || "dev";
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  base: { env },
  transport:
    apiKey && ddEnabled
      ? {
          target: "pino-datadog-transport",
          options: ddOptions,
        }
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
});

export default logger;

// Attach Datadog trace context (session/user) to the active span
export function attachLogTraceContext(
  req: Request,
  _: Response,
  next: NextFunction
) {
  const jti = (req as any).decodedJWT?.jti;
  const userId = (req as any).decodedJWT?.sub;

  const span = tracer.scope().active();
  if (span && jti) span.setTag("session.id", jti);
  if (span && userId) span.setTag("user.id", userId);

  next();
}
