"use client"

import React from "react"
import { useRouter } from "next/navigation"

export default function NewUploadButton() {
    const router = useRouter()
    return (
        <button
            onClick={() => router.push("/upload")}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg py-2 px-4 text-sm font-semibold"
        >
            New Upload
        </button>
    )
}