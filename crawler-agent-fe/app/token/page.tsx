"use client"

import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import CrawlSearchLog from "../components/CrawlSearchLog";
import axios, { AxiosResponse } from "axios";

const SELLER_SERVICE = {
    name: process.env.NEXT_PUBLIC_SELLER_SERVICE_NAME, 
};

export default function CrawlWithTokenPage() {
    const [userApiKey, setUserApiKey] = useState<string>("")
    const [showApiKeyInput, setShowApiKeyInput] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [kyaToken, setKyaToken] = useState<string | null>("")
    const [decodedToken, setDecodedToken] = useState<any>(null)

    const handleStartOver = async () => {
      setKyaToken(null)
      setDecodedToken(null);
    }

    const handleCreateToken = async () => {
      try {
        const response: AxiosResponse<{token:string, error: string}> = await axios.post(
          `${process.env.NEXT_PUBLIC_SERVICE_BASE_URL}/token`,
          {userApiKey: userApiKey},
        );
        if (response.data.error) {
          setError(response.data.error);
          setKyaToken(null);
          return;
        }
        setError(null);
        setKyaToken(response.data.token);
        setDecodedToken(null);
      } catch (err: any) {
        const apiError = err.response?.data?.error || "Unknown error";
        setError(apiError);
        setKyaToken(null);
      }
    }

    const isJWT = (token: string): boolean => {
        const parts = token.split('.')
        if (parts.length !== 3) {
            return false;
        }
        try {
            const header = JSON.parse(atob(parts[0]));
            if (!header || !header.alg) {
                return false;
            }
            JSON.parse(atob(parts[1]));
        } catch {
            return false;
        }
        return true;
    }

    const handleDecodeToken = () => {
        if (!kyaToken) return;
        if (isJWT(kyaToken)) {
            try {
                const header = jwtDecode(kyaToken, { header: true });
                const payload = jwtDecode(kyaToken);
                setDecodedToken({ header, payload });
            } catch (err) {
                setDecodedToken({ error: "Failed to decode token." });
            }
        } else {
            setDecodedToken({ error: "Token is not a valid JWT." });
        }
    }

    return (
        <div className="w-full p-6 bg-[#fafbfc] min-h-screen flex flex-col">
            <div className="flex flex-col gap-1 mb-2">
              <button
                className="px-6 py-2 border border-gray-600 text-gray-600 rounded font-semibold bg-white hover:bg-gray-50 transition w-fit"
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              >
                Try with your own API key? (Optional)
              </button>
              <a
                href="https://docs.skyfire.xyz/docs/introduction"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 text-gray-800 font-semibold text-sm hover:underline"
              >
                Refer to Skyfire Platform Guide for creating API key
              </a>
            </div>
            {showApiKeyInput && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 shadow-md mt-4 w-full mb-6">
                <div className="flex items-center gap-3 w-full">
                  <span className="text-gray-500 text-sm">Enter your API Key:</span>
                  <input
                    type="text"
                    value={userApiKey}
                    onChange={e => setUserApiKey(e.target.value)}
                    className="font-bold border border-gray-300 rounded px-3 py-2 w-96 max-w-full focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-gray-900"
                  />
                </div>
              </div>
            )}
            <h2 className="text-2xl font-bold mb-1">Step 1: Create KYA Token</h2>
            <div className="mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 shadow-md mt-6 w-full">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm">Seller Service:</span>
                  <span className="font-semibold text-base text-gray-900">{SELLER_SERVICE.name}</span>
                </div>
              </div>
            </div>
            <div className="break-all text-red-600 text-base font-semibold">
              {error}
            </div>
            {
            kyaToken ? 
            <>
              <div className="flex gap-2 mt-4">
                  <button
                      className="px-6 py-2 bg-black text-white rounded font-semibold hover:bg-gray-800 transition disabled:opacity-60"
                      onClick={handleStartOver}
                  >
                      ↻ Start Over
                  </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold mt-5 mb-1">Step 2: Inspect the created token</h2>
                <div className="bg-white shadow-md rounded-lg p-6 mt-6 w-full border border-gray-200 flex flex-col gap-4">
                    
                      <div className="break-all text-gray-900 text-base">
                        {kyaToken}
                      </div>
                      <button
                        className="px-6 py-2 bg-black text-white rounded font-semibold hover:bg-gray-800 transition mb-4 mt-2 w-fit"
                        onClick={handleDecodeToken}
                      >
                        Decode Token
                      </button>
                      {decodedToken && (
                        <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-3 text-sm text-gray-900 overflow-x-auto">
                          {decodedToken.error ? (
                            <div className="text-red-600">{decodedToken.error}</div>
                          ) : (
                            <>
                              <div className="font-semibold mb-1">Header:</div>
                              <pre className="mb-2 whitespace-pre-wrap break-all">{JSON.stringify(decodedToken.header, null, 2)}</pre>
                              <div className="font-semibold mb-1">Payload:</div>
                              <pre className="whitespace-pre-wrap break-all">{JSON.stringify(decodedToken.payload, null, 2)}</pre>
                            </>
                          )}
                        </div>
                      )}
                </div>
                <div className="mt-8">
                  <h2 className="text-2xl font-bold mb-1">Step 3: Select website to crawl</h2>
                  <div className="mt-6">
                    <CrawlSearchLog skyfireKyaToken={kyaToken} />
                  </div>
                </div>
                </div>
                </>
             :  
              <div className="flex flex-col gap-2 mt-4">
                <button
                  className="px-6 py-2 bg-black text-white rounded font-semibold hover:bg-gray-800 transition disabled:opacity-60 w-fit"
                  onClick={handleCreateToken}
                >
                  Create Token
                </button>
              </div>
            }
        </div>
    )
} 