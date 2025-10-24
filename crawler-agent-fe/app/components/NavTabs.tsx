"use client"

import { useRouter, usePathname } from "next/navigation"

const tabs = [
  { 
    label: "Crawl without Token", 
    route: "/",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    label: "Crawl with Token", 
    route: "/token",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    )
  },
]

const NavTabs: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="inline-flex rounded-lg bg-blue-10 p-1 shadow-sm border border-gray-200">
      {tabs.map((tab) => {
        const isActive = pathname === tab.route
        return (
          <button
            key={tab.route}
            className={`flex items-center gap-2 rounded-md px-6 py-2 font-medium transition-all duration-200 ${
              isActive
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
            onClick={() => router.push(tab.route)}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default NavTabs
