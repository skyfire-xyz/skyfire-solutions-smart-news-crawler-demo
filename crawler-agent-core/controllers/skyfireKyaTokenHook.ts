export function skyfireKyaTokenHook(token: string, userAgent: string) {
  return async (crawlingContext, gotOptions) => {
    crawlingContext.request.headers = {
      ...crawlingContext.request.headers,
      "skyfire-pay-id": token ?? "",
      "x-isbot": "true",
      "user-agent": userAgent ?? "",
    };
    gotOptions.headers = {
      ...gotOptions.headers,
      "skyfire-pay-id": token ?? "",
      "x-isbot": "true",
      "user-agent": userAgent ?? "",
    };
  };
}
