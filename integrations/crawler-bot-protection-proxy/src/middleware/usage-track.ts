import { Request, NextFunction, Response } from "express";
import { hasVerifiedJwt, isBotRequest } from "../type";
import logger from "../services/logger";

export default async function usageTrack(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {

  // Only process authenticated bot requests
  if (!isBotRequest(req) || !hasVerifiedJwt(req)) {
    next();
    return;
  }

  const jwtPayload = req.decodedJWT;

  logger.info({
    msg: "KYA Token detected",
    jwtPayload,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });

  res.setHeader("X-Identity-Verified", "true");

  next();
}

