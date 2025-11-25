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
  console.log("event", JSON.stringify(event));

  const headers = event.headers || {};
  const methodArn = event.methodArn; // IMPORTANT: REST API uses methodArn

  if (headers["skyfire-pay-id"]) {
    const skyfireToken = headers["skyfire-pay-id"] || null;
    console.log("skyfireToken", skyfireToken);

    try {
      const payload = await verifier.verify(skyfireToken);
      console.log("payload", payload);
      console.log("Token is valid!");
    } catch (err) {
      console.log("Exception", err);
      console.log("Token not valid!");

      return {
        principalId: "abcdef",
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "execute-api:Invoke",
              Effect: "Deny",
              Resource: methodArn
            }
          ]
        },
        context: {
          error: "Invalid token `skyfire-pay-id`. Please use valid kya token - https://docs.skyfire.xyz/reference/create-token."
        }
      };
    }
  }

  return {
    principalId: "abcdef",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: methodArn
        }
      ]
    },
    context: {
      stringKey: "value",
      numberKey: 1,
      booleanKey: true
    }
  };
};