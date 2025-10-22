import { Request, Response, NextFunction } from "express";
import { hasVerifiedJwt, isBotRequest } from "../type";
import { UsageSessionManager } from "../services/usage-session-manager";
import { chargeToken } from "../services/skyfire-api";
import logger from "../services/logger";

// Environment variables will be read inside the function for test flexibility

export default async function usageTrack(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Read environment variables inside the function for test flexibility
  const batchAmountThreshold =
    Number(process.env.BATCH_AMOUNT_THRESHOLD) || 0.1;
  const sessionDurationSeconds =
    Number(process.env.REDIS_SESSION_EXPIRY) || 300;
  const overrideMaximumRequestCount = Number(
    process.env.OVERRIDE_MAXIMUM_REQUEST_COUNT
  );

  // Only process authenticated bot requests
  if (!isBotRequest(req) || !hasVerifiedJwt(req)) {
    next();
    return;
  }

  const jwtPayload = req.decodedJWT;
  const redisKey = `session:${jwtPayload.jti}`;
  const perRequestAmount = Number(jwtPayload.spr) || 0;
  const maximumRequestCount =
    overrideMaximumRequestCount || Number(jwtPayload.mnr) || 1000; // For testing purpose override the maximum request count

  logger.info({
    msg: `Threshold Config`,
    MNR: maximumRequestCount,
    SPR: perRequestAmount,
    MaxDuration: sessionDurationSeconds,
    BatchAmountThreshold: batchAmountThreshold,
  });

  // Initialize the usage session manager
  const manager = new UsageSessionManager(
    redisKey,
    perRequestAmount,
    maximumRequestCount,
    sessionDurationSeconds,
    batchAmountThreshold
  );

  // If the session is new, charge the token first and get the remaining balance
  let initialCharge = false;
  let totalChargedAmount = 0;
  const sessionExists = await manager.sessionExists();
  if (!sessionExists) {
    logger.info(`🆕 New session created for token: ${jwtPayload.jti}`);

    // Create a new session
    await manager.createNewSession(req.skyfireToken);

    try {
      const { remainingBalance } = await chargeToken(
        req.skyfireToken,
        perRequestAmount,
        jwtPayload.jti
      ); // Charge the token

      initialCharge = true;
      totalChargedAmount = perRequestAmount;

      // Reset accumulated amount
      await manager.resetAccumulated();
      await manager.updateRemainingBalance(remainingBalance);

      await logSession(
        jwtPayload,
        manager,
        `Initial charge: charged ${perRequestAmount}`
      );
    } catch (error) {
      logger.error(`[Session: ${jwtPayload.jti}] Error charging token:`, error);
      res.status(402).json({
        error: `Payment Required: Error charging Token. Kya+pay token is depleted, please create a new token.`,
        reason: "insufficient_balance",
      });
      return;
    }
  }

  // Check if threashold is reached
  // 0. Ignore if the session is new and already charged.
  // 1. Is the  remaining balance is insufficient for the next request
  // 2. Is the request count has reached the maximum allowed requests
  const hasReachedRemainingBalance = await manager.hasReachedRemainingBalance();
  const hasReachedMaximumRequestCount =
    await manager.hasReachedMaximumRequestCount();

  if (
    sessionExists &&
    (hasReachedRemainingBalance || hasReachedMaximumRequestCount)
  ) {
    await logSession(
      jwtPayload,
      manager,
      `[Threshold reached] Error:402: hasReachedRemainingBalance=${hasReachedRemainingBalance} hasReachedMaximumRequestCount=${hasReachedMaximumRequestCount}`,
      "warn"
    );

    // Check if user owes any accumulated amount
    // Note: Leave this logic here to just make sure the user is charged for the accumulated amount.
    const accumulated = await manager.getAccumulatedAmount();

    // If there is an accumulated amount, charge the token before returning the response.
    if (accumulated > 0) {
      try {
        // Charge the token
        const { remainingBalance } = await chargeToken(
          req.skyfireToken,
          accumulated,
          jwtPayload.jti
        );
        // Reset accumulated amount
        await manager.resetAccumulated();
        await manager.updateRemainingBalance(remainingBalance);

        totalChargedAmount = accumulated;
      } catch (error) {
        logger.error(
          `[Session: ${jwtPayload.jti}] Error charging token:`,
          error
        );
        res.status(402).json({
          error: `Payment Required: Error charging Token. Kya+pay token is depleted, please create a new token.`,
          reason: "insufficient_balance",
        });
        return;
      }
    }

    // 402 Payment Required: token usage exceeded. Blocked from returning the response.

    const hasCharges = totalChargedAmount > 0;
    await makePaymentHeaders(res, manager, totalChargedAmount);

    if (hasReachedRemainingBalance) {
      res.status(402).json({
        error: `Payment Required: token usage exceeded, please create a new token. Insufficient balance. ${
          hasCharges ? `Accumulated amount was charged.` : ""
        }`,
        reason: "insufficient_balance",
      });
      return;
    } else if (hasReachedMaximumRequestCount) {
      res.status(402).json({
        error: `Payment Required: token usage exceeded, please create a new token. Maximum request count reached. ${
          hasCharges ? `Accumulated amount was charged.` : ""
        }`,
        reason: "batch_limit_reached",
      });
      return;
    }
  }

  // Update the usage session count, accumulated amount, and remaining balance.
  await manager.updateUsage({ skipAccumulation: initialCharge }); // Skip accumulation if it's already charged for the initial request.

  const hasReachedBatch = await manager.hasReachedBatchThreshold();
  if (hasReachedBatch) {
    // Handle batch threshold reached logic
    // e.g., charge the accumulated amount
    const accumulated = await manager.getAccumulatedAmount();
    if (accumulated && accumulated > 0) {
      try {
        // Charge accumulated amount
        const { remainingBalance } = await chargeToken(
          req.skyfireToken,
          accumulated,
          jwtPayload.jti
        );
        // Reset accumulated amount
        await manager.resetAccumulated();
        await manager.updateRemainingBalance(remainingBalance);

        totalChargedAmount = accumulated;
      } catch (error) {
        logger.warn(
          `[Session: ${jwtPayload.jti}] Error charging token:`,
          error
        );
        res.status(402).json({
          error: `Payment Required: Error charging Token. Kya+pay token is depleted, please create a new token.`,
          reason: "insufficient_balance",
        });
        return;
      }
    }

    await logSession(
      jwtPayload,
      manager,
      `Threashold reached: Batch amount threshold reached. We charged the accumulated amount.`
    );
  }

  // Store session data for expiration handling
  await manager.storeSessionDataForExpiration();

  // Add payment info to response headers
  await makePaymentHeaders(res, manager, totalChargedAmount);

  await logSession(jwtPayload, manager);

  next();
}

/**
 * Creates payment headers for response
 */
async function makePaymentHeaders(
  res: Response,
  manager: UsageSessionManager,
  chargedAmount?: number
): Promise<void> {
  const [count, accumulated, remainingBalance, sessionExpiry] =
    await Promise.all([
      manager.getRequestCount(),
      manager.getAccumulatedAmount(),
      manager.getRemainingBalance(),
      manager.getSessionExpirationTimestamp(),
    ]);

  res.setHeader("X-Payment-Charged", chargedAmount?.toString() || "0");
  res.setHeader("X-Payment-Session-Count", count.toString());
  res.setHeader("X-Payment-Session-Accumulated-Amount", accumulated.toString());
  res.setHeader(
    "X-Payment-Session-Remaining-Balance",
    remainingBalance?.toString() || "0"
  );
  res.setHeader(
    "X-Payment-Session-Token-MNR",
    manager.maximumRequestCount.toString()
  );
  res.setHeader(
    "X-Payment-Session-Expires-At",
    sessionExpiry?.toString() || "0"
  );
  res.setHeader(
    "X-Payment-Session-Batch-Threshold",
    manager.batchAmountThreshold.toString()
  );
}

/**
 * Logs session payment information
 */
async function logSession(
  jwtPayload: any,
  manager: UsageSessionManager,
  additionalInfo?: string,
  level: "info" | "warn" | "error" = "info"
): Promise<void> {
  const [count, accumulated, remainingBalance] = await Promise.all([
    manager.getRequestCount(),
    manager.getAccumulatedAmount(),
    manager.getRemainingBalance(),
  ]);

  const logData = {
    msg: "Session Summary",
    jti: jwtPayload.jti,
    count,
    accumulated,
    remainingBalance: remainingBalance?.toString() || "0",
  };

  if (level === "error") {
    logger.error(logData, additionalInfo);
  } else if (level === "warn") {
    logger.warn(logData, additionalInfo);
  } else {
    logger.info(logData, additionalInfo);
  }
}
