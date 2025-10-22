"use client"

export default function TopBar() {
  return (
    <div className="w-full border-b border-gray-200 px-6 pt-8 pb-4">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Smart Web Crawler
        </h1>
        <div>
          <p className="text-gray-700 dark:text-gray-200 text-base leading-relaxed mb-2">
            This demo web crawler illustrates how token-based identification can be used to access and crawl protected websites.<br/>
            There are two sample URLs provided:
          </p>
          <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 text-base space-y-1">
            <li>
              <span className="font-semibold">Unprotected Website:</span> Accessible to the crawler without any token.
            </li>
            <li>
              <span className="font-semibold">Protected Website:</span> Requires a <span className="font-mono">kya</span> token to allow crawler access.
            </li>
          </ul>
          <div className="mt-4">
            <a
              href="https://youtu.be/onkJ1LlS7q8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-gray-800 text-white rounded font-semibold text-sm shadow hover:bg-gray-700 transition"
            >
              Reference Video: How the Smart Web Crawler Works
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}