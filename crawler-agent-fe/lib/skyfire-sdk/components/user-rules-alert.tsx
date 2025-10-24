import React from "react"
import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface UserLimitsExceededAlertProps {
  message?: string
  onUpgrade?: () => void
}

export const UserLimitsExceededAlert: React.FC<
  UserLimitsExceededAlertProps
> = ({ message = "You've reached your usage limits", onUpgrade }) => {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="size-4" />
      <AlertTitle>Usage Limit Exceeded</AlertTitle>
      <AlertDescription className="flex flex-col gap-4">
        <p>{message}</p>
        {onUpgrade && (
          <Button variant="outline" className="w-fit" onClick={onUpgrade}>
            Upgrade Plan
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
