import { Request, Response, NextFunction } from "express";
import { jwtVerify, createRemoteJWKSet, errors as joseErrors } from "jose";
import { DecodedSkyfireJwt, isBotRequest } from "../type";
import logger from "../services/logger";

const JWT_ALGORITHM = "ES256";
const SKYFIRE_API_URL =
  process.env.SKYFIRE_API_URL || "https://api.skyfire.xyz";
const JWKS_URL = SKYFIRE_API_URL + "/.well-known/jwks.json";
const JWT_ISSUER = process.env.JWT_ISSUER!;
const JWT_AUDIENCE = process.env.SELLER_SERVICE_AGENT_ID!;
const JWT_SSI = process.env.SELLER_SERVICE_ID!;
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

export default async function verifyHeader(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Only verify token if request is from a bot
  if (!isBotRequest(req)) {
    next();
    return;
  }

  const skyfireToken = req.header("skyfire-pay-id") || "";

  if (!skyfireToken) {
    res.status(402).json({ error: "Missing Kya token `skyfire-pay-id`. Please create an account at https://app.skyfire.xyz and create a kya+pay token - https://docs.skyfire.xyz/reference/create-token."});
    return;
  }

  // Verify JWT
  try {
    const { payload } = await jwtVerify(skyfireToken, JWKS, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: [JWT_ALGORITHM],
    });

    if ((payload as any).ssi !== JWT_SSI) {
      res.status(401).json({ error: "Invalid SSI in token" });
      return;
    }

    // Attach decoded info to req for downstream middleware
    req.decodedJWT = payload as unknown as DecodedSkyfireJwt;
    req.skyfireToken = skyfireToken;

    next();
    return;
  } catch (err: unknown) {
    logger.warn({ err }, "Error while verifying token: ");
    if (err instanceof joseErrors.JOSEError) {
      res.status(401).json({
        error: "Your JWT token is invalid",
        errorCode: (err as any).code,
        message: (err as any).message,
      });
      return;
    }
    res.status(401).json({
      error: "Something went wrong while verifying your JWT token",
      errorCode: "JWT_VERIFICATION_ERROR",
    });
    return;
  }
}
