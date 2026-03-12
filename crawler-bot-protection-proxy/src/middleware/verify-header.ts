import { Request, Response, NextFunction } from "express";
import { DecodedSkyfireJwt, isBotRequest } from "../type";
import { verifyKyaToken } from "../verify-kya-token";

const MISSING_KYA_TEXT =
  "Missing KYA token in the skyfire-pay-id header. Please create an account at https://app.skyfire.xyz and create a 'kya-pay' token - https://docs.skyfire.xyz/reference/create-token . Include the token in your request in the skyfire-pay-id header.";

const INVALID_KYA_TEXT =
  "Invalid KYA token in the skyfire-pay-id header. Please create an account at https://app.skyfire.xyz and create a 'kya-pay' token - https://docs.skyfire.xyz/reference/create-token . Include the token in your request in the skyfire-pay-id header.";

export default async function verifyHeader(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!isBotRequest(req)) {
    next();
    return;
  }

  const skyfireToken = req.header("skyfire-pay-id") || "";

  if (!skyfireToken) {
    res.status(403).json({ error: MISSING_KYA_TEXT });
    return;
  }

  const verifyResult = await verifyKyaToken(skyfireToken);
  if (!verifyResult.success) {
    res.status(401).json({ error: INVALID_KYA_TEXT });
    return;
  }

  req.decodedJWT = verifyResult.payload as unknown as DecodedSkyfireJwt;
  req.skyfireToken = skyfireToken;

  next();
}
