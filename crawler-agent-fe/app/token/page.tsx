"use client"

import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import CrawlSearchLog from "../components/CrawlSearchLog";
import axios, { AxiosResponse } from "axios";
import PageLayout from "../components/PageLayout";
import TopBar from "../components/TopBar";

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
        <>
            <TopBar />
            <PageLayout>
                <div className="space-y-6">
                    {/* API Key Section */}
                    <div className="bg-blue-50 rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="mb-4">
                            <button
                                className="w-fit rounded border border-gray-600 bg-white px-6 py-2 font-semibold text-gray-600 transition hover:bg-gray-50"
                                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                            >
                                Try with your own API key? (Optional)
                            </button>
                            <a
                                href="https://docs.skyfire.xyz/docs/introduction"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-4 text-sm font-semibold text-gray-800 hover:underline"
                            >
                                Refer to Skyfire Platform Guide for creating API key
                            </a>
                        </div>
                        
                        {showApiKeyInput && (
                            <div className="mt-4 flex w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-md">
                                <div className="flex w-full items-center gap-3">
                                    <span className="text-sm text-gray-500">Enter your API Key:</span>
                                    <input
                                        type="text"
                                        value={userApiKey}
                                        onChange={e => setUserApiKey(e.target.value)}
                                        className="w-96 max-w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Token Creation Section */}
                    <div className="bg-blue-50 rounded-lg border border-gray-200 p-4 shadow-sm">
                        <h2 className="mb-4 text-xl font-semibold text-gray-900">Step 1: Create KYA Token</h2>
                        
                        <div className="mb-6">
                            <div className="mt-6 flex w-full flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-md">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">Seller Service:</span>
                                    <span className="text-base font-semibold text-gray-900">{SELLER_SERVICE.name}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="break-all text-base font-semibold text-red-600">
                            {error}
                        </div>
                        
                        {kyaToken ? (
                            <>
                                <div className="mt-4 flex gap-2">
                                    <button
                                        className="rounded bg-black px-6 py-2 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                                        onClick={handleStartOver}
                                    >
                                        ↻ Start Over
                                    </button>
                                </div>
                                
                                <div className="mt-6">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900">Step 2: Inspect the created token</h2>
                                    <div className="mt-6 flex w-full flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                                        <div className="break-all text-base text-gray-900">
                                            {kyaToken}
                                        </div>
                                        <button
                                            className="mb-4 mt-2 w-fit rounded bg-black px-6 py-2 font-semibold text-white transition hover:bg-gray-800"
                                            onClick={handleDecodeToken}
                                        >
                                            Decode Token
                                        </button>
                                        {decodedToken && (
                                            <div className="mt-4 overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900">
                                                {decodedToken.error ? (
                                                    <div className="text-red-600">{decodedToken.error}</div>
                                                ) : (
                                                    <>
                                                        <div className="mb-1 font-semibold">Header:</div>
                                                        <pre className="mb-2 whitespace-pre-wrap break-all">{JSON.stringify(decodedToken.header, null, 2)}</pre>
                                                        <div className="mb-1 font-semibold">Payload:</div>
                                                        <pre className="whitespace-pre-wrap break-all">{JSON.stringify(decodedToken.payload, null, 2)}</pre>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900">Step 3: Select website to crawl</h2>
                                    <div className="mt-6">
                                        <CrawlSearchLog skyfireKyaToken={kyaToken} />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="mt-4 flex flex-col gap-2">
                                <button
                                    className="w-fit rounded bg-black px-6 py-2 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
                                    onClick={handleCreateToken}
                                >
                                    Create Token
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </PageLayout>
        </>
    )
}