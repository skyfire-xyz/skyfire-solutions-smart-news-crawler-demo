"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { Alert, AlertType } from "../types"

interface SearchBarProps {
  onSearch: () => void
  channelId?: string
  inputDepth?: string
  inputPayment?: string
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>
  skyfireKyaToken?: string
}

// Define the form schema with Zod
const searchFormSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Invalid URL format")
    .regex(/^https?:\/\//, "URL must start with http:// or https://"),
  botType: z.string().optional(),
  userAgent: z.string().optional(),
})

type SearchFormValues = z.infer<typeof searchFormSchema>

interface Suggestion {
  url: string
  name: string
  type: string
}

interface BotTypes {
  type: string
  description: string
  userAgent: string
}

const suggestions: Suggestion[] = [
  { url: "https://skyfire.xyz", name: "Skyfire", type: "Unprotected" },
  {
    url: "https://mock-news-site.skyfire.xyz/",
    name: "MockNews",
    type: "Protected",
  },
  { url: "https://ac8t87if5a.execute-api.us-east-1.amazonaws.com/dev/real-estate", name: "MockNews (API Gateway)", type: "Protected" }, //https://mock-news-site-aws-api-gateway.skyfire.xyz/dev/real-estate/
  {
    url: "https://vmqjil4y49.execute-api.us-east-1.amazonaws.com/dev/real-estate", //https://mock-news-site-aws-api-gateway-waf.skyfire.xyz/dev/real-estate/
    name: "MockNews (API Gateway + WAF)",
    type: "Protected",
  },
  { url: "https://dex1j9lx64e98.cloudfront.net/", name: "MockNews (CloudFront)", type: "Protected" }, //https://mock-news-site-aws-cloudfront.skyfire.xyz/
  {
    url: "https://dex4cbi52l5ce.cloudfront.net/", //https://mock-news-site-aws-cloudfront-waf.skyfire.xyz/
    name: "MockNews (CloudFront + WAF)",
    type: "Protected",
  },
]

const botTypes: BotTypes[] = [
  {
    type: "Good bot",
    description:
      "Open access to protected content for Search Engine Bot (google/bing etc)",
    userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  },
  {
    type: "AI bot",
    description: "Requires Skyfire KYA Token to access protected content",
    userAgent: "GPTBot/1.0 (+https://www.gptbot.ai/)",
  },
  { type: "Bad bot", description: "Access not authorized at all",
    userAgent: ""
   },
]

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  channelId,
  inputDepth,
  inputPayment,
  setAlerts,
  skyfireKyaToken,
}) => {
  const [kyaToken, setKyaToken] = useState<string>(skyfireKyaToken || "")
  const [isLoading, setIsLoading] = useState(false)

  const [isUrlFocused, setIsUrlFocused] = useState(false)
  const [selectedUrlIndex, setSelectedUrlIndex] = useState(-1)

  const [isBotFocused, setIsBotFocused] = useState(false)
  const [selectedBotIndex, setSelectedBotIndex] = useState(-1)

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      url: "",
      botType: "",
      userAgent: "",
    },
  })

  // watch selected url to decide whether to show bot dropdown
  const selectedUrl = form.watch("url")
  const showBotDropdown = [
    "https://vmqjil4y49.execute-api.us-east-1.amazonaws.com/dev/real-estate", //"https://mock-news-site-aws-api-gateway-waf.skyfire.xyz/dev/real-estate/",
    "https://dex4cbi52l5ce.cloudfront.net/", //"https://mock-news-site-aws-cloudfront-waf.skyfire.xyz/"
  ].includes(selectedUrl)

  // clear botType when bot dropdown shouldn't be shown
  if (!showBotDropdown && form.getValues("botType")) {
    form.setValue("botType", "")
  }

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isUrlFocused || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedUrlIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedUrlIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedUrlIndex >= 0) {
          form.setValue("url", suggestions[selectedUrlIndex].url)
          setIsUrlFocused(false)
          setSelectedUrlIndex(-1)
        }
        break
      case "Escape":
        setIsUrlFocused(false)
        setSelectedUrlIndex(-1)
        break
    }
  }

  const handleBotKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isBotFocused || botTypes.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedBotIndex((prev) =>
          prev < botTypes.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedBotIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        console.log("selectedBotIndex", selectedBotIndex);
        if (selectedBotIndex >= 0) {
          console.log("botTypes[selectedBotIndex]", botTypes[selectedBotIndex]);
          form.setValue("botType", botTypes[selectedBotIndex].type)
          form.setValue("userAgent", botTypes[selectedBotIndex].userAgent)
          setIsBotFocused(false)
          setSelectedBotIndex(-1)
        }
        break
      case "Escape":
        setIsBotFocused(false)
        setSelectedBotIndex(-1)
        break
    }
  }

  const onSubmit = async (data: SearchFormValues) => {
    console.log("data in onSubmit", data);
    setIsUrlFocused(false)
    setIsBotFocused(false)
    await onSearch()
    try {
      setIsLoading(true)
      setAlerts([])

      const crawlerEndpoint = `${process.env.NEXT_PUBLIC_SERVICE_BASE_URL}/crawl`
      const requestBody = {
        startUrl: data.url,
        channelId: channelId,
        skyfireKyaToken: kyaToken,
        ...(inputPayment &&
          inputPayment !== "" && { inputCost: Number(inputPayment) }),
        ...(inputDepth &&
          inputDepth !== "" && { inputDepth: Number(inputDepth) }),
        ...(data.botType && { "botType": data.botType }),
        ...(data.userAgent && { "userAgent": data.userAgent }),
      }

      const headers: Record<string, string> = {
        "content-type": "application/json",
      }

      await axios.post(crawlerEndpoint, requestBody, { headers })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.message === "Network Error") {
          setAlerts([
            {
              type: AlertType.NETWORK,
              message: "Backend is unreachable",
            },
          ])
        } else {
          setAlerts([
            {
              type: AlertType.INVALID,
              message: err.message,
            },
          ])
        }
      }
      console.error("Search error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const onStop = async () => {
    try {
      setIsLoading(false)
      await axios.post(
        `${process.env.NEXT_PUBLIC_SERVICE_BASE_URL}/crawl/stop`,
        { channelId: channelId }
      )
      // setAlerts([{ type: AlertType.INFO, message: "Crawling stopped." }]);
    } catch (err) {
      // setAlerts([{ type: AlertType.INVALID, message: "Failed to stop crawling." }]);
      console.error("Stop error:", err)
    }
  }

  return (
    <Form {...form}>
      <form className="flex w-full flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        onFocus={() => setIsUrlFocused(true)}
                        onBlur={() =>
                          setTimeout(() => setIsUrlFocused(false), 200)
                        }
                        onKeyDown={handleUrlKeyDown}
                        placeholder="Select or Enter website URL"
                        autoComplete="off"
                      />
                      {isUrlFocused && (
                        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                          {suggestions.map((suggestion, index) => (
                            <div
                              key={suggestion.url}
                              className={`cursor-pointer border-b px-4 py-3 last:border-b-0 ${
                                index === selectedUrlIndex
                                  ? "border-blue-200 bg-gray-50"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                field.onChange(suggestion.url)
                                setIsUrlFocused(false)
                                setSelectedUrlIndex(-1)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                  <span
                                    className={`rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800 ${
                                      suggestion.type === "Protected"
                                        ? "mr-4"
                                        : ""
                                    }`}
                                  >
                                    {suggestion.type}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium text-gray-900">
                                      {suggestion.name}
                                    </div>
                                    <div className="mt-1 truncate text-xs text-gray-500">
                                      {suggestion.url}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <div className="absolute top-8 text-sm">
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            {/* Show botType dropdown only for specific protected MockNews URLs */}
            {showBotDropdown && (
              <div className="mt-3">
                <FormField
                  control={form.control}
                  name="botType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            onFocus={() => setIsBotFocused(true)}
                            onBlur={() => setTimeout(() => setIsBotFocused(false), 200)}
                            onKeyDown={handleBotKeyDown}
                            placeholder="Select bot category"
                            autoComplete="off"
                          />
                          {isBotFocused && (
                            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                              {botTypes.map((bot, index) => (
                                <div
                                  key={bot.type}
                                  className={`cursor-pointer border-b px-4 py-3 last:border-b-0 ${
                                    index === selectedBotIndex ? "border-blue-200 bg-gray-50" : "hover:bg-gray-50"
                                  }`}
                                  onClick={() => {
                                    field.onChange(bot.type)
                                    setIsBotFocused(false)
                                    setSelectedBotIndex(-1)
                                    form.setValue("userAgent", bot.userAgent)
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-sm font-medium text-gray-900">
                                        {bot.type}
                                      </div>
                                      <div className="mt-1 truncate text-xs text-gray-500">
                                        {bot.description}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading ? "Crawling..." : "Crawl"}
          </Button>
          {isLoading ? (
            <Button
              type="button"
              onClick={() => form.handleSubmit(onStop)()}
              disabled={!isLoading}
              variant="secondary"
            >
              Stop Crawling
            </Button>
          ) : (
            <></>
          )}
        </div>
      </form>
    </Form>
  )
}

export default SearchBar
