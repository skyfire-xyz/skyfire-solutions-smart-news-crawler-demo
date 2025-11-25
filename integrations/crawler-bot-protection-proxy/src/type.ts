import { Request } from "express";

export interface DecodedSkyfireJwt {
  env: string;
  btg: string;
  ssi: string;
  value: string;
  amount: string;
  sps: string;
  spr: string;
  mnr: number;
  cur: string;
  iat: number;
  iss: string;
  jti: string;
  aud: string;
  sub: string;
  exp: number;
}
export interface BotRequest extends Request {
  isBot?: boolean;
  decodedJWT?: DecodedSkyfireJwt;
  skyfireToken?: string;
}
export interface VerifiedJWTRequest extends BotRequest {
  isBot: true;
  decodedJWT: DecodedSkyfireJwt;
  skyfireToken: string;
}

// Type guards
export function isBotRequest(req: Request): req is BotRequest {
  return (req as BotRequest).isBot === true;
}

export function hasVerifiedJwt(req: Request): req is VerifiedJWTRequest {
  const verifiedReq = req as VerifiedJWTRequest;
  return (
    verifiedReq.isBot === true &&
    !!verifiedReq.decodedJWT &&
    !!verifiedReq.skyfireToken
  );
}

export function isHumanRequest(req: Request): req is Request {
  return (req as BotRequest).isBot !== true;
}
