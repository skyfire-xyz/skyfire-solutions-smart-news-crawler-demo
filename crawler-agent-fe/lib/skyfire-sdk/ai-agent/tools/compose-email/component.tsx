"use client"

import React, { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export const Component: React.FC<{
  initialData?: {
    to?: string
    subject?: string
    body?: string
  }
  disabled?: boolean
  onSubmit: (emailData: { to: string; subject: string; body: string }) => void
  onCancel: () => void
}> = ({ initialData = {}, disabled, onSubmit, onCancel }) => {
  const [emailData, setEmailData] = useState({
    to: initialData.to || "",
    subject: initialData.subject || "",
    body: initialData.body || "",
  })
  const [canceled, setCanceled] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setEmailData({ ...emailData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(emailData)
  }

  return (
    <Card className="w-full max-w-md mx-auto mb-4">
      {!canceled && (
        <CardHeader>
          <CardTitle className="text-lg">Compose Email</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {canceled && (
          <p className="pt-6 text-center text-primary">
            Email has been canceled.
          </p>
        )}
        {!canceled && (
          <form onSubmit={() => {}} className="space-y-4">
            <div>
              <Input
                type="email"
                name="to"
                placeholder="Recipient's email"
                value={emailData.to}
                onChange={handleChange}
                required
                disabled={disabled}
              />
            </div>
            <div>
              <Input
                type="text"
                name="subject"
                placeholder="Subject"
                value={emailData.subject}
                onChange={handleChange}
                required
                disabled={disabled}
              />
            </div>
            <div>
              <Textarea
                name="body"
                placeholder="Email body"
                value={emailData.body}
                onChange={handleChange}
                rows={5}
                required
                disabled={disabled}
              />
            </div>
          </form>
        )}
      </CardContent>
      {!disabled && !canceled && (
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setCanceled(true)
              onCancel()
            }}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Send Email
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
