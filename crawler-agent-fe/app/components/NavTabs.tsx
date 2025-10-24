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
    <div className="mb-4 flex items-center gap-2 border-b border-gray-200">
      {tabs.map((tab) => {
        const isActive = pathname === tab.route
        return (
          <button
            key={tab.route}
            className={`-mb-px border-b-2 px-4 py-2 transition focus:outline-none ${
              isActive
                ? "border-blue-600 font-semibold text-blue-600"
                : "border-transparent text-gray-600 hover:border-blue-600 hover:text-blue-600"
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
