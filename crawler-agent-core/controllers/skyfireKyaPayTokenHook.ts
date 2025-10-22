export function skyfireKyaPayTokenHook(token: string) {
  return async (crawlingContext, gotOptions) => {
    crawlingContext.request.headers = {
      ...crawlingContext.request.headers,
      "skyfire-pay-id": token ?? "",
      "x-isbot": "true"
    };
    gotOptions.headers = {
      ...gotOptions.headers,
      "skyfire-pay-id": token ?? "",
      "x-isbot": "true"
    };
  };
}