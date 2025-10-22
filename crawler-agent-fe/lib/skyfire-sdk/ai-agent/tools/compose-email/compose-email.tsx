import React from "react"
import { z } from "zod"

import { BaseTool } from "../basetool.class"
import { Component } from "./component"

class ComposeEmailTool extends BaseTool {
  public static override readonly toolName = "compose_email"

  public static override readonly instruction = `
    When user asks to send email to someone:
    1. First, respond to the user acknowledging their request. If there is a context that you can add in Subject, Body or recipient's email, please do so. If not available, leave them as blank.
    2. Then, execute the "compose_email" tool with the recipient's information (if available).
  `

  public override createTool() {
    return this.createBaseTool(
      "Compose email",
      z.object({
        to: z.string(),
        subject: z.string(),
        body: z.string(),
      }),
      async ({ to, subject, body }) => {
        // In a real implementation, you might want to add some email composition logic here
        return {
          role: "function",
          name: ComposeEmailTool.toolName,
          content: JSON.stringify({ to, subject, body, success: true }),
        }
      }
    )
  }

  public static override ClientComponent: React.FC<{
    initialData?: {
      to?: string
      subject?: string
      body?: string
    }
    disabled?: boolean
    onSubmit: (emailData: { to: string; subject: string; body: string }) => void
    onCancel: () => void
  }> = (props) => {
    return <Component {...props} />
  }
}

export default ComposeEmailTool
