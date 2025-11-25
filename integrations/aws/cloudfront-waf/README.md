3. Example Lambda@Edge Function: Skyfire Token Verification

import { JwtVerifier } from "aws-jwt-verify";

// Create the verifier outside the Lambda handler (= during cold start),
// so the cache can be reused for subsequent invocations. Then, only during the
// first invocation, will the verifier actually need to fetch the JWKS.
const verifier = JwtVerifier.create({
   issuer: "https://app-qa.skyfire.xyz",
   audience: "ab73a4e6-11c2-40d7-a07f-c61e95ffed2c",
   jwksUri: "https://app-qa.skyfire.xyz/.well-known/jwks.json",
 });


export const handler = async (event) => {
 const { request } = event.Records[0].cf;
 if (request.headers["skyfire-pay-id"]) {
   const skyfireToken = request.headers["skyfire-pay-id"][0].value || null;
   try {
     const payload = await verifier.verify(skyfireToken); 
     } catch {
     return {
       status: "402",
       body: "Invalid token received",
     };
   }
 }
 return request; // allow request to proceed
};






This example uses a Viewer Request event so token validation happens before cache evaluation.