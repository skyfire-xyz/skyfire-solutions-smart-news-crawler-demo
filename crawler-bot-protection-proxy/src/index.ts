import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { connectRedis, disconnectRedis } from "./lib/redis";
import { startExpiryMonitor } from "./services/session-expiry-monitor";
import usageTrack from "./middleware/usage-track";
import verifyHeader from "./middleware/verify-header";
import { createProxyMiddleware } from "http-proxy-middleware";
import identifyBot from "./middleware/identify-bot";
import logger, { attachLogTraceContext } from "./services/logger";
import "./lib/dd-agent";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Step 0: Identify Bot
app.use(identifyBot);

// Step 1: Verify Skyfire Token in header
app.use(verifyHeader); // if you have JWT verification
app.use(attachLogTraceContext);

// Step 2: Track usage and Charge
app.use(usageTrack);

// Step 3: Proxy the request if the token is valid.
app.use(
  "/",
  createProxyMiddleware({
    target:
      process.env.PROXY_TARGET || "https://demo-real-estate-prv4.onrender.com/",
    changeOrigin: true,
  })
);

const startServer = async (): Promise<void> => {
  try {
    await connectRedis();

    // Start session expiry monitor (works with any Redis service)
    await startExpiryMonitor();

    app.listen(PORT, () => {
      logger.info(`Proxy server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server: ");
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully...");
  await disconnectRedis();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down gracefully...");
  await disconnectRedis();
  process.exit(0);
});

startServer();
