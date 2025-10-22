// src/utils/UsageSessionManager.ts

import { redis } from "../lib/redis";
import {
  trackSessionExpiry,
  removeSessionFromTracking,
} from "./session-expiry-monitor";
import logger from "./logger";

/**
 * Manages usage session, request counting, and batch charge thresholds for a token/session.
 */
export class UsageSessionManager {
  private redisKey: string;
  public perRequestAmount: number;
  public maximumRequestCount: number;
  public sessionDuration: number;
  public batchAmountThreshold: number;

  constructor(
    redisKey: string,
    perRequestAmount: number,
    maximumRequestCount: number,
    sessionDuration: number,
    batchAmountThreshold: number
  ) {
    this.redisKey = redisKey;
    this.perRequestAmount = perRequestAmount;
    this.maximumRequestCount = maximumRequestCount;
    this.sessionDuration = sessionDuration;
    this.batchAmountThreshold = batchAmountThreshold;
  }

  private parseFloatSafe(value: number): number {
    return Math.round(value * 1000000) / 1000000;
  }

  async createNewSession(jwtToken: string): Promise<void> {
    const multi = redis.multi();
    multi.hset(this.redisKey, "jwtToken", jwtToken);
    multi.hset(this.redisKey, "count", "0");
    multi.hset(this.redisKey, "accumulated", "0");
    multi.hset(this.redisKey, "lastRequest", Date.now().toString());
    multi.hset(this.redisKey, "remainingBalance", "0");
    multi.expire(this.redisKey, this.sessionDuration);

    await multi.exec();

    // Track session expiry
    const expiryTime = Date.now() + this.sessionDuration * 1000;
    await trackSessionExpiry(this.redisKey, expiryTime);
  }

  /**
   * Increments usage counters: count, accumulated amount, and sets last activity.
   * Returns the updated count, accumulated amount, and whether this is a new session.
   */
  async updateUsage({
    skipAccumulation = false,
  }: { skipAccumulation?: boolean } = {}): Promise<{
    count?: number;
    accumulated?: number;
    isNewSession: boolean;
  }> {
    // Check if this is a new session before incrementing
    const sessionExists = await this.sessionExists();

    const multi = redis.multi();
    multi.hincrby(this.redisKey, "count", 1);

    if (!skipAccumulation) {
      multi.hincrbyfloat(this.redisKey, "accumulated", this.perRequestAmount);
    }

    multi.hset(this.redisKey, "lastRequest", Date.now());
    multi.expire(this.redisKey, this.sessionDuration);

    const execResult = await multi.exec();

    let count: number | undefined = undefined;
    let accumulated: number | undefined = undefined;

    if (execResult && Array.isArray(execResult)) {
      const countRes = execResult[0];
      if (Array.isArray(countRes) && typeof countRes[1] === "number") {
        count = countRes[1];
      }

      if (!skipAccumulation) {
        const accumulatedRes = execResult[1];
        if (
          Array.isArray(accumulatedRes) &&
          typeof accumulatedRes[1] === "string"
        ) {
          accumulated = Number(accumulatedRes[1]);
        }
      } else {
        // If skipping accumulation, get the current accumulated amount
        accumulated = await this.getAccumulatedAmount();
      }
    }

    // Update expiry tracking
    const expiryTime = Date.now() + this.sessionDuration * 1000;
    await trackSessionExpiry(this.redisKey, expiryTime);

    return { count, accumulated, isNewSession: !sessionExists };
  }

  /**
   * Updates the remaining balance in Redis.
   */
  async updateRemainingBalance(newBalance: string): Promise<void> {
    await redis.hset(this.redisKey, "remainingBalance", newBalance);
  }

  /**
   * Resets the accumulated amount and count in Redis after a batch charge.
   */
  async resetAccumulated(): Promise<void> {
    const multi = redis.multi();
    multi.hset(this.redisKey, "accumulated", "0");
    await multi.exec();
  }

  /**
   * Gets the current remaining balance from Redis.
   */
  async getRemainingBalance(): Promise<number | null> {
    try {
      const balance = await redis.hget(this.redisKey, "remainingBalance");
      return balance !== null ? Number(balance) : null;
    } catch (err) {
      logger.error(
        { err },
        `[Session: ${this.redisKey}] Error getting remaining balance:`
      );
      return null;
    }
  }

  /**
   * Gets the current request count from Redis.
   */
  async getRequestCount(): Promise<number> {
    try {
      const count = await redis.hget(this.redisKey, "count");
      return count !== null ? Number(count) : 0;
    } catch (err) {
      logger.error(
        { err },
        `[Session: ${this.redisKey}] Error getting request count:`
      );
      return 0;
    }
  }

  /**
   * Gets the current accumulated amount from Redis.
   */
  async getAccumulatedAmount(): Promise<number> {
    try {
      const accumulated = await redis.hget(this.redisKey, "accumulated");
      return accumulated !== null ? Number(accumulated) : 0;
    } catch (err) {
      logger.error(
        { err },
        `[Session: ${this.redisKey}] Error getting accumulated amount:`
      );
      return 0;
    }
  }
  /**
   * Checks if the session exists in Redis.
   */
  async sessionExists(): Promise<boolean> {
    try {
      const exists = await redis.exists(this.redisKey);
      return exists === 1;
    } catch (err) {
      logger.error(
        { err },
        `[Session: ${this.redisKey}] Error checking if session exists:`
      );
      return false;
    }
  }

  /**
   * Checks if the request count has reached the maximum allowed requests.
   */
  async hasReachedMaximumRequestCount(): Promise<boolean> {
    try {
      const count = await this.getRequestCount();
      return count >= this.maximumRequestCount;
    } catch (err) {
      logger.error(
        { err },
        `[Session: ${this.redisKey}] Error checking maximum request count:`
      );
      return false;
    }
  }

  /**
   * Checks if the remaining balance is insufficient for the next request.
   */
  async hasReachedRemainingBalance(): Promise<boolean> {
    const balance = await this.getRemainingBalance();
    const accumulated = await this.getAccumulatedAmount();
    const requiredAmount = this.parseFloatSafe(
      this.perRequestAmount + accumulated
    );

    logger.error(
      `[Session: ${this.redisKey}] hasReachedRemainingBalance: balance=${balance}, accumulated=${accumulated}, perRequestAmount=${this.perRequestAmount}, batchAmountThreshold=${this.batchAmountThreshold}`
    );

    return balance === null || balance === 0 || balance < requiredAmount;
  }

  /**
   * Checks if the accumulated amount has reached the batch threshold.
   */
  async hasReachedBatchThreshold(): Promise<boolean> {
    try {
      const accumulated = await this.getAccumulatedAmount();
      return accumulated >= this.batchAmountThreshold;
    } catch (err) {
      logger.error(
        { err },
        `[Session: ${this.redisKey}] Error checking batch threshold:`
      );
      return false;
    }
  }

  /**
   * Gets the actual expiration timestamp (Unix timestamp in milliseconds)
   */
  async getSessionExpirationTimestamp(): Promise<number | null> {
    try {
      const lastRequest = await redis.hget(this.redisKey, "lastRequest");
      if (!lastRequest) return null;

      const lastRequestTime = Number(lastRequest);
      const expirationTime = lastRequestTime + this.sessionDuration * 1000;
      return expirationTime;
    } catch (err) {
      logger.error(
        { err },
        `[Session: ${this.redisKey}] Error getting session expiration timestamp:`
      );
      return null;
    }
  }

  /**
   * Gets the stored JWT token from the session
   */
  async getJWT(): Promise<string | null> {
    try {
      const jwt = await redis.hget(this.redisKey, "jwtToken");
      return jwt;
    } catch (err) {
      logger.error({ err }, `[Session: ${this.redisKey}] Error getting JWT:`);
      return null;
    }
  }

  /**
   * Stores session data in a stream before expiration for later retrieval
   */
  async storeSessionDataForExpiration(): Promise<void> {
    try {
      const sessionData = await redis.hgetall(this.redisKey);
      if (sessionData && Object.keys(sessionData).length > 0) {
        // Store in a hash that doesn't expire (simpler than streams)
        const dataKey = `session_data:${this.redisKey}`;
        await redis.hset(
          dataKey,
          "session_id",
          this.redisKey,
          "count",
          sessionData.count || "0",
          "accumulated",
          sessionData.accumulated || "0",
          "jwtToken",
          sessionData.jwtToken || "",
          "remainingBalance",
          sessionData.remainingBalance || "0",
          "updated_at",
          Date.now().toString()
        );

        // Set expiration for the data key (cleanup after 1 hour)
        await redis.expire(dataKey, 3600);
      }
    } catch (err) {
      logger.error(
        { err },
        `[Session: ${this.redisKey}] Error storing session data for expiration:`
      );
    }
  }

  /**
   * Manually delete session and remove from tracking
   */
  async deleteSession(): Promise<void> {
    try {
      await redis.del(this.redisKey);
      await removeSessionFromTracking(this.redisKey);
      logger.info(`[Session: ${this.redisKey}] Manually deleted session`);
    } catch (err) {
      logger.error(
        { err },
        `[Session: ${this.redisKey}] Error deleting session:`
      );
    }
  }
}
