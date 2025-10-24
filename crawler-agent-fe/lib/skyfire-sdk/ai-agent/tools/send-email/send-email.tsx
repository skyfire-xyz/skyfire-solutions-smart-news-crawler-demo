import React from "react"
import { z } from "zod"

import { BaseTool } from "../basetool.class"
import { Component } from "./component"

interface SendEmailConfig {
  SKYFIRE_ENDPOINT_URL: string
  apiKey: string
}

export class SendEmailTool extends BaseTool {
  public static override readonly toolName = "send_email"

  public static override readonly instruction = `
    When the user responds with "Email to x", and you can find the data <Email> in the latest message:
    1. First, respond to the user acknowledging their request.
    2. Then, execute the "send_email" tool with parameters inside the JSON object. html is going to be the email body, please format HTML nicely based on the email content (subject, body).

    Make sure to only send email when user says "Email to x", and use latest <Email> data from the previous message because there could be multiple <Email> data in the conversation.
  `

  public override createTool() {
    const { SKYFIRE_ENDPOINT_URL, apiKey } = this.config as SendEmailConfig

    return this.createBaseTool(
      "Send Email to recipient",
      z.object({
        to: z.string(),
        html: z.string(),
      }),
      async ({ to, html }) => {
        try {
          const response = await fetch(
            `${SKYFIRE_ENDPOINT_URL}/v1/receivers/toolkit/send-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "skyfire-api-key": apiKey,
              },
              body: JSON.stringify({
                recipientEmail: to,
                emailData: html,
              }),
            }
          )

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
        } catch (error) {
          console.error(`Error Sending Email`, error)
          return {
            role: "function",
            name: SendEmailTool.toolName,
            content: JSON.stringify({
              to: to,
              success: false,
            }),
          }
        }

        return {
          role: "function",
          name: SendEmailTool.toolName,
          content: JSON.stringify({
            to: to,
            success: true,
          }),
        }
      }
    )
  }

  public static override ClientComponent: React.FC<{
    result: {
      to: string
      success: boolean
    }
  }> = ({ result }) => {
    return <Component result={result} />
  }
}

export default SendEmailTool
