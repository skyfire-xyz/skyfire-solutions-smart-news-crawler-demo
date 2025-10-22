import { useCallback, useEffect, useState } from "react"

export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false)

  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < breakpoint)
  }, [breakpoint])

  useEffect(() => {
    // Check on mount
    checkMobile()

    // Add event listener
    window.addEventListener("resize", checkMobile)

    // Clean up
    return () => window.removeEventListener("resize", checkMobile)
  }, [checkMobile])

  return isMobile
}
