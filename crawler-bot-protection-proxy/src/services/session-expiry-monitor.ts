import { redis } from "../lib/redis";
import { chargeToken } from "./skyfire-api";
import logger from "./logger";

const EXPIRY_TRACKING_KEY = "session_expiries";
const MONITOR_INTERVAL =
  Number(process.env.EXPIRE_MONITOR_INTERVAL) || 30 * 1000; // Default 30 seconds

/**
 * Handle session expiration - charge accumulated amounts and cleanup
 */
async function handleSessionExpiration(sessionKey: string): Promise<void> {
  try {
    // Get session data from backup hash
    const dataKey = `session_data:${sessionKey}`;
    const sessionData = await redis.hgetall(dataKey);

    if (sessionData && Object.keys(sessionData).length > 0) {
      const { accumulated, jwtToken } = sessionData;

      // Charge accumulated amount if any
      if (Number(accumulated) > 0 && jwtToken) {
        logger.info({
          event: "session_expired",
          sessionId: sessionKey,
          msg: `⏰ Session expired. Charging accumulated amount: ${accumulated}`,
        });

        try {
          await chargeToken(jwtToken, Number(accumulated), sessionKey);
        } catch (error) {
          logger.error({
            event: "session_expiry_charge_failed",
            sessionId: sessionKey,
            error,
            msg: "⏰ Failed to charge accumulated amount on session expiry",
          });
        }
      } else {
        logger.info({
          event: "session_expired",
          sessionId: sessionKey,
          msg: "⏰ Session expired - No accumulated amount.",
        });
      }

      // Clean up the data key
      await redis.del(dataKey);
      logger.info({
        event: "session_expiry_cleanup",
        sessionId: sessionKey,
        msg: "⏰ Cleaned up session data after expiry",
      });
    } else {
      logger.info({
        event: "session_expiry_no_data",
        sessionId: sessionKey,
        msg: "⏰ No session data found on expiry",
      });
    }
  } catch (error) {
    logger.error({
      event: "session_expiry_error",
      sessionId: sessionKey,
      error,
      msg: "⏰ Error processing expired session",
    });
  }
}

/**
 * Process expired sessions using Redis Sorted Set
 */
async function processExpiredSessions(): Promise<void> {
  try {
    const now = Date.now();

    // Get all sessions that have expired (score <= now)
    const expiredSessions = await redis.zrangebyscore(
      EXPIRY_TRACKING_KEY,
      0,
      now
    );

    for (const sessionKey of expiredSessions) {
      try {
        // Double-check if the session actually exists in Redis
        const sessionExists = await redis.exists(sessionKey);

        if (!sessionExists) {
          // Session has actually expired, process it
          await handleSessionExpiration(sessionKey);

          // Remove from tracking set
          await redis.zrem(EXPIRY_TRACKING_KEY, sessionKey);
          logger.info({
            event: "session_expiry_removed",
            sessionId: sessionKey,
            msg: "⏰ Removed from expiry tracking",
          });
        }
      } catch (error) {
        logger.error(
          `[Session: ${sessionKey}] Error processing expired session:`,
          error
        );
      }
    }
  } catch (error) {
    logger.error("Error in processExpiredSessions:", error);
  }
}

/**
 * Start the session expiry monitor
 */
export async function startExpiryMonitor(): Promise<void> {
  // Process any expired sessions on startup
  await processExpiredSessions();

  // Set up periodic monitoring
  setInterval(async () => {
    try {
      await processExpiredSessions();
    } catch (error) {
      logger.error({ error }, "Error in session expiry monitor:");
    }
  }, MONITOR_INTERVAL);

  logger.info(
    `Session expiry monitor started - checking every ${
      MONITOR_INTERVAL / 1000
    } seconds`
  );
}

/**
 * Add a session to expiry tracking
 */
export async function trackSessionExpiry(
  sessionKey: string,
  expiryTime: number
): Promise<void> {
  try {
    await redis.zadd(EXPIRY_TRACKING_KEY, expiryTime, sessionKey);
    logger.info(
      `[Session: ${sessionKey}] Reset Expiry at ${new Date(expiryTime)})`
    );
  } catch (error) {
    logger.error(
      { error },
      `[Session: ${sessionKey}] Error tracking session expiry:`
    );
  }
}

/**
 * Remove a session from expiry tracking (when manually deleted)
 */
export async function removeSessionFromTracking(
  sessionKey: string
): Promise<void> {
  try {
    await redis.zrem(EXPIRY_TRACKING_KEY, sessionKey);
    logger.info(`[Session: ${sessionKey}] Removed from expiry tracking`);
  } catch (error) {
    logger.error(
      { error },
      `[Session: ${sessionKey}] Error removing session from tracking:`
    );
  }
}
