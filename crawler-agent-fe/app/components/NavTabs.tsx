"use client"

import { useRouter, usePathname } from "next/navigation"

const tabs = [
  { label: "Crawl without Token", route: "/" },
  { label: "Crawl with Token", route: "/token" },
]

const NavTabs: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 mb-4">
      {tabs.map((tab) => {
        const isActive = pathname === tab.route
        return (
          <button
            key={tab.route}
            className={`px-4 py-2 -mb-px border-b-2 focus:outline-none transition ${
              isActive
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-600"
            }`}
            onClick={() => router.push(tab.route)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default NavTabs
