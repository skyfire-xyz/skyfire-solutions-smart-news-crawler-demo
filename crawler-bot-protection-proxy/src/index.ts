import express, { RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
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

// Add request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  logger.info({
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    headers: {
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? '[REDACTED]' : undefined,
    }
  }, 'Proxy request received');

  // Log response when it finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
    }, 'Proxy request completed');
  });

  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Step 0: Identify Bot
app.use(identifyBot);

// Step 1: Verify Skyfire Token in header
app.use(verifyHeader); // if you have JWT verification
app.use(attachLogTraceContext);

// Step 2: Track usage and Charge
app.use(usageTrack as unknown as RequestHandler);

// Step 3: Proxy the request if the token is valid.
const envProxyTarget = process.env.PROXY_TARGET;
const defaultTarget = "https://mock-news.onrender.com/";

// Handle empty, null, or undefined PROXY_TARGET
let proxyTarget: string;
if (!envProxyTarget || envProxyTarget.trim() === '') {
  proxyTarget = defaultTarget;
  logger.info({ 
    reason: 'PROXY_TARGET is empty or not set',
    envValue: envProxyTarget,
    usingDefault: true
  }, 'Using default proxy target');
} else {
  proxyTarget = envProxyTarget.trim();
}

// Validate proxy target URL
logger.info({ 
  proxyTarget, 
  envValue: envProxyTarget,
  length: proxyTarget.length 
}, 'Proxy target validation');

try {
  const url = new URL(proxyTarget);
  logger.info({ 
    proxyTarget,
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname
  }, 'Proxy target configured successfully');
} catch (error) {
  logger.error({ 
    error: error instanceof Error ? error.message : String(error), 
    proxyTarget,
    envValue: envProxyTarget,
    length: proxyTarget.length,
    charCodes: proxyTarget.split('').map(c => c.charCodeAt(0))
  }, 'Invalid proxy target URL');
  
  // Try to use default if the env value is invalid
  if (envProxyTarget && envProxyTarget.trim() !== '') {
    logger.info('Attempting to use default proxy target as fallback');
    try {
      const defaultUrl = new URL(defaultTarget);
      proxyTarget = defaultTarget;
      logger.info({ 
        proxyTarget: defaultTarget,
        protocol: defaultUrl.protocol,
        hostname: defaultUrl.hostname,
        port: defaultUrl.port,
        pathname: defaultUrl.pathname
      }, 'Using default proxy target as fallback');
    } catch (fallbackError) {
      logger.error({ error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError) }, 'Default proxy target is also invalid');
      process.exit(1);
    }
  } else {
    process.exit(1);
  }
}

app.use(
  createProxyMiddleware({
    target: proxyTarget,
    changeOrigin: true,
    pathFilter: (pathname) => {
      // Don't proxy health check endpoint
      return pathname !== '/health';
    }
  })
);

// Error handling middleware
app.use((err: Error, req: any, res: any, _next: any) => {
  logger.error({ error: err, url: req.url }, 'Proxy middleware error');
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async (): Promise<void> => {
  try {
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
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down gracefully...");
  process.exit(0);
});

startServer();