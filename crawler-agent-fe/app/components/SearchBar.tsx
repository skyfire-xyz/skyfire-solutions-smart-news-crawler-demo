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
  skyfireKyaPayToken?: string
}

// Define the form schema with Zod
const searchFormSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Invalid URL format")
    .regex(/^https?:\/\//, "URL must start with http:// or https://"),
})

type SearchFormValues = z.infer<typeof searchFormSchema>

interface Suggestion {
  url: string
  name: string
  type: string
}

const suggestions: Suggestion[] = [
  { url: "https://skyfire.xyz", name: "Skyfire", type: "Unprotected" },
  { url: "https://real-estate-list-scraping-demo.skyfire.xyz/", name: "Real Estate", type: "Protected"}
]

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  channelId,
  inputDepth,
  inputPayment,
  setAlerts,
  skyfireKyaPayToken,
}) => {
  const [kyaPayToken, setKyaPayToken] = useState<string>(skyfireKyaPayToken || "")
  const [isLoading, setIsLoading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      url: "",
    },
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isFocused || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          form.setValue("url", suggestions[selectedIndex].url)
          setIsFocused(false)
          setSelectedIndex(-1)
        }
        break
      case "Escape":
        setIsFocused(false)
        setSelectedIndex(-1)
        break
    }
  }

  const onSubmit = async (data: SearchFormValues) => {
    setIsFocused(false)
    await onSearch()
    try {
      setIsLoading(true)
      setAlerts([])

      const crawlerEndpoint = `${process.env.NEXT_PUBLIC_SERVICE_BASE_URL}/crawl` 
      const requestBody = {
        startUrl: data.url,
        channelId: channelId,
        skyfireKyaPayToken: kyaPayToken,
        ...(inputPayment &&
          inputPayment !== "" && { inputCost: Number(inputPayment) }),
        ...(inputDepth &&
          inputDepth !== "" && { inputDepth: Number(inputDepth) }),
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
      setIsLoading(false); 
      await axios.post(`${process.env.NEXT_PUBLIC_SERVICE_BASE_URL}/crawl/stop`, {channelId: channelId});
      // setAlerts([{ type: AlertType.INFO, message: "Crawling stopped." }]);
    } catch (err) {
      // setAlerts([{ type: AlertType.INVALID, message: "Failed to stop crawling." }]);
      console.error("Stop error:", err);
    }
  };

  return (
    <Form {...form}>
      <form className="flex w-full max-w-3xl flex-col space-y-4">
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
                        onFocus={() => setIsFocused(true)}
                        onBlur={() =>
                          setTimeout(() => setIsFocused(false), 200)
                        }
                        onKeyDown={handleKeyDown}
                        placeholder="Select or Enter website URL"
                        autoComplete="off"
                      />
                      {isFocused && (
                        <div className="absolute w-full mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                          {suggestions.map((suggestion, index) => (
                            <div
                              key={suggestion.url}
                              className={`px-4 py-3 cursor-pointer border-b last:border-b-0 ${
                                index === selectedIndex
                                  ? "bg-blue-50 border-blue-200"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                field.onChange(suggestion.url)
                                setIsFocused(false)
                                setSelectedIndex(-1)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 ${
                                      suggestion.type === "Protected" 
                                        ? "mr-4" 
                                        : ""
                                    }`}
                                  >
                                    {suggestion.type}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-gray-900 truncate">
                                      {suggestion.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate mt-1">
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
          </div>

          <Button
            type="button"
            onClick={() => form.handleSubmit(onSubmit)()}
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading ? "Crawling..." : "Crawl"}
          </Button>
          {isLoading ? 
          <Button
            type="button"
            onClick={() => form.handleSubmit(onStop)()}
            disabled={!isLoading}
            variant="secondary"
          >
            Stop Crawling
          </Button>
          : <></>
          }
        </div>
      </form>
    </Form>
  )
}

export default SearchBar
