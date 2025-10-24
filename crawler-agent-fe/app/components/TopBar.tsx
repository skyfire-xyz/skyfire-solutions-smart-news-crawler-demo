"use client"

export default function TopBar() {
  return (
    <div className="w-full border-b border-gray-200 px-6 pb-4 pt-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Smart Web Crawler
        </h1>
        <div>
          <p className="mb-2 text-base leading-relaxed text-gray-700 dark:text-gray-200">
            This demo web crawler illustrates how token-based identification can be used to access and crawl protected websites.<br/>
            There are two sample URLs provided:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-base text-gray-700 dark:text-gray-300">
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
              className="inline-block rounded bg-gray-800 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-gray-700"
            >
              Reference Video: How the Smart Web Crawler Works
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}