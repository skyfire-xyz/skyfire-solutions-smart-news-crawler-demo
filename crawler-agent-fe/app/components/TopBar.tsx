"use client"

import NavTabs from "./NavTabs";

export default function TopBar() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pl-36 pt-6">
      {/* Header Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl">
          {/* Smart Web Crawler Badge */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Smart Web Crawler
            </div>
          </div>

          {/* Main Title */}
          <h1 className="mb-4 text-5xl font-extrabold">
              Smart Web Crawler
          </h1>

          {/* Description */}
          <p className="mb-6 text-lg text-gray-600 max-w-2xl">
            This demo web crawler illustrates how token-based identification can be used to access and crawl protected websites. There are two sample URLs provided:
          </p>

          {/* Website Type Descriptions */}
          <div className="mb-6 flex gap-6">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Protected Website.</p>
                <p className="text-sm text-gray-600">Requires a KYA token to allow crawler access.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900">Unprotected Website.</p>
                <p className="text-sm text-gray-600">Accessible to the crawler without any token.</p>
              </div>
            </div>
          </div>

          {/* Reference Video Button */}
          <div className="mb-3">
            <a
              href="https://youtu.be/onkJ1LlS7q8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white transition hover:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Reference Video: How the Smart Web Crawler Works
            </a>
          </div>

          {/* Navigation Tabs - Slider Style */}
          <div className="mb-0">
            <NavTabs />
          </div>
        </div>
      </div>
    </div>
  );
}