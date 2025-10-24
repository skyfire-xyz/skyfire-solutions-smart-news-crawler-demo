import React from "react"
import { z } from "zod"

import { BaseTool } from "../basetool.class"
import { Component } from "./component"

class ShowImagesTool extends BaseTool {
  public static override readonly toolName = "show_images"

  public static override readonly instruction = `
    When you have referenced images or when the user asks to show images:
    1. First, respond to the user acknowledging their request and answering their question.
    2. Then, execute the "show_images" tool instead of putting image URLs in the response.
  `

  public override createTool() {
    return this.createBaseTool(
      "Show image URL(s)",
      z.object({
        images: z.array(
          z.object({
            imageURL: z.string(),
            name: z.string(),
          })
        ),
      }),
      async ({ images }) => {
        return {
          role: "function",
          name: ShowImagesTool.toolName,
          content: JSON.stringify({ images, success: true }),
        }
      }
    )
  }

  public static override ClientComponent: React.FC<{
    images: { imageURL: string; name: string }[]
  }> = ({ images }) => {
    return <Component images={images} />
  }
}

export default ShowImagesTool
