"use client"

import React from "react"
import Image from "next/image"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export const Component: React.FC<{
  images: { imageURL: string; name: string }[]
}> = ({ images }) => {
  const IMAGE_HEIGHT = 200
  const IMAGE_WIDTH = 300

  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md">
      <div className="flex space-x-4 p-4">
        {images.map((image) => (
          <div
            key={image.imageURL}
            className="relative group"
            style={{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
          >
            <Image
              src={image.imageURL}
              alt={image.name}
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-70 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 rounded-lg">
              <div className="overflow-hidden">
                <h2 className="text-sm font-semibold line-clamp-1">
                  {image.name}
                </h2>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
