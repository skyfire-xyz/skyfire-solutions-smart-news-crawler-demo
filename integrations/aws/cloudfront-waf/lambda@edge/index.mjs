import { JwtVerifier } from "aws-jwt-verify";

// Create the verifier outside the Lambda handler (= during cold start),
// so the cache can be reused for subsequent invocations. Then, only during the
// first invocation, will the verifier actually need to fetch the JWKS.
const verifier = JwtVerifier.create({
    issuer: "https://app.skyfire.xyz", 
    audience: "5e014586-11af-48f4-94e7-7ad15b97fae7", 
    jwksUri: "https://app.skyfire.xyz/.well-known/jwks.json",
  });

export const handler = async (event) => {
  const { request } = event.Records[0].cf;
  if (request.headers["skyfire-pay-id"] && request.headers["skyfire-pay-id"][0].value) {
    const skyfireToken = request.headers["skyfire-pay-id"][0].value || null; 
    console.log("skyfireToken", skyfireToken);
    try {
      console.log("in try block");
      const payload = await verifier.verify(skyfireToken); //"eyHhbGciOiJFUzI1NiIsImtpZCI6IjAiLCJ0eXAiOiJreWErcGF5K0pXVCJ9.eyJ2ZXIiOiIxLjAiLCJlbnYiOiJxYSIsImJ0ZyI6ImI0YmU5YTRmLTFiMTUtMGNiOS1kYzE4LTUxYmRlODZiODk0OSIsInNzaSI6IjVlN2YzMzU5LTllYzEtNDA3OC1iZjQ1LTQwMWQwNzlhZjFiZSIsInNjb3BlcyI6W10sImJpZCI6eyJza3lmaXJlRW1haWwiOiJzdXByZWV0QHNreWZpcmUueHl6In0sImFpZCI6eyJjcmVhdGlvbl9pcCI6IjI2MDc6ZmVhODpkYTE6MzIwMDpiNTg1OmU5Mjk6ODU3OmNkMDkiLCJzb3VyY2VfaXBzIjpbXX0sInZhbHVlIjoiNTAwMDAiLCJhbW91bnQiOiIwLjA1IiwiY3VyIjoiVVNEIiwic3RwIjoiQ09JTiIsInN0aSI6eyJ0eXBlIjoiVVNEQyJ9LCJzcHIiOiIwLjAwMSIsInNwcyI6IlBBWV9QRVJfVVNFIiwibW5yIjo1MCwiaWF0IjoxNzYyNTMyNjQxLCJpc3MiOiJodHRwczovL2FwcC1xYS5za3lmaXJlLnh5eiIsImp0aSI6Ijc2MTFiNTA1LWQ2YWEtNDcxNy05NDM0LTFiYThmNGUxNWU0NSIsImF1ZCI6ImFiNzNhNGU2LTExYzItNDBkNy1hMDdmLWM2MWU5NWZmZWQyYyIsInN1YiI6ImY4MDBjMmIyLWNiMTctNDQ0Ny1iYTY0LTBlZjdjYjEyYTVmNCIsImV4cCI6MTc2MjYxOTA0MX0.RIy01FNl7ApZDTOn8z2pn3HP4o-DyI4rkA42WBzIHt6Vri17pI5rQtLeDgb_8LUdG7gKQDu85SeT1AhiAd3Z0w"
      console.log("before");
      console.log("payload", payload);
      console.log("after");
      console.log("Token is valid!");
    } catch {
      console.log("Token not valid!");
      return {
        status: "402",
        body: "Invalid token received",
      };
    }
  }
  return request; // allow request to proceed
};