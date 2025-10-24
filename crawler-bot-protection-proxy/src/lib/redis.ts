import Redis from "ioredis";
import dotenv from "dotenv";
import logger from "../services/logger";

dotenv.config();

// Support both REDIS_URL and individual REDIS_HOST/REDIS_PORT
let redisUrl: string;
if (process.env.REDIS_URL) {
  redisUrl = process.env.REDIS_URL;
} else {
  const host = process.env.REDIS_HOST || "localhost";
  const port = process.env.REDIS_PORT || "6379";
  redisUrl = `redis://${host}:${port}`;
}

export const redis = new Redis(redisUrl, {
  retryStrategy: (times: number): number | void => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});

redis.on("connect", () => {
  logger.info("Connected to Redis");
});

redis.on("error", (err) => {
  logger.error({ err }, "Redis connection error: ");
});

redis.on("ready", () => {
  logger.info("Redis is ready");
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
  } catch (error) {
    logger.error({ error }, "Failed to connect to Redis: ");
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redis.disconnect();
  } catch (error) {
    logger.error({ error }, "Failed to disconnect from Redis: ");
  }
};
