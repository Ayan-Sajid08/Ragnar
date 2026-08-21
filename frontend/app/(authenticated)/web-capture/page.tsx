"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import JSZip from "jszip"

type CaptureMode = "long" | "parts"

interface WebCaptureResult {
    success: boolean
    id: string | null
    name: string | null
    url: string
    title: string | null
    capture_mode: CaptureMode
    image_urls: string[]
    image_names: string[]
    error: string | null
}

export default function WebCapturePage() {
    const [url, setUrl] = useState("")
    const [captureMode, setCaptureMode] =
        useState<CaptureMode>("long")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [result, setResult] =
        useState<WebCaptureResult | null>(null)

    const supabase = createClient()

    function downloadScreenshot(
        imageUrl: string,
        filename: string
    ) {
        const link = document.createElement("a")

        link.href = imageUrl
        link.download = filename

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    async function downloadAllScreenshots() {
        if (!result) return

        const zip = new JSZip()

        for (let i = 0; i < result.image_urls.length; i++) {
            const imageUrl = result.image_urls[i]
            const filename =
                result.image_names[i] ||
                `screenshot_${i + 1}.png`

            const response = await fetch(imageUrl)
            const blob = await response.blob()

            zip.file(filename, blob)
        }

        const zipBlob = await zip.generateAsync({
            type: "blob",
        })

        const zipUrl = URL.createObjectURL(zipBlob)

        const link = document.createElement("a")
        link.href = zipUrl
        link.download = `${result.name || "web-capture"}.zip`

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(zipUrl)
    }

    async function handleCapture() {
        setError("")
        setResult(null)

        if (!url.trim()) {
            setError("Please enter a website URL.")
            return
        }

        let captureUrl = url.trim()

        if (
            !captureUrl.startsWith("http://") &&
            !captureUrl.startsWith("https://")
        ) {
            captureUrl = `https://${captureUrl}`
        }

        setLoading(true)

        try {
            const {
                data: { session }
            } = await supabase.auth.getSession()

            const token = session?.access_token

            if (!token) {
                setError("You are not authenticated.")
                setLoading(false)
                return
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/web/capture`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        url: captureUrl,
                        capture_mode: captureMode
                    })
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data?.detail ||
                    data?.error ||
                    "Failed to capture website."
                )
            }

            if (!data.success) {
                throw new Error(
                    data.error ||
                    "Failed to capture website."
                )
            }

            const signedImageUrls: string[] = []
            const imageNames: string[] = []

            for (const imageUrl of data.image_urls) {
                console.log("Storage path:", imageUrl)

                const { data: fileData, error: fileError } =
                    await supabase.storage
                        .from("web_capture")
                        .download(imageUrl)

                console.log("Download result:", {
                    fileData,
                    fileError,
                })

                if (fileError) {
                    throw new Error(
                        `Failed to access screenshot: ${fileError.message}`
                    )
                }

                const objectUrl = URL.createObjectURL(fileData)

                signedImageUrls.push(objectUrl)

                // Get the original filename from the storage path
                const filename = imageUrl.split("/").pop()

                imageNames.push(
                    filename || `screenshot_${imageNames.length + 1}.png`
                )
            }

            setResult({
                ...data,
                image_urls: signedImageUrls,
                image_names: imageNames,
            })

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-950 h-screen overflow-hidden flex items-center justify-center">

            <div className="relative w-[70rem] h-[44rem]">

                {/* Capture Card */}

                <div
                    className={`
                    absolute
                    top-1/2
                    -translate-y-1/2

                    w-[28rem]
                    bg-gray-900
                    p-8
                    rounded-xl
                    flex flex-col
                    gap-4
                    text-gray-100

                    transition-all
                    duration-700
                    ease-in-out

                    ${result
                            ? "left-0 translate-x-0"
                            : "left-1/2 -translate-x-1/2"
                        }
                      `}
                >

                    <h1 className="text-2xl font-bold text-center">
                        Web Capture
                    </h1>

                    <p className="text-center text-gray-400">
                        Capture a website as a screenshot.
                    </p>

                    <input
                        type="text"
                        placeholder="Website URL"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={loading}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleCapture()
                            }
                        }}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-xl py-2 px-4 outline-none placeholder:text-gray-400"
                    />

                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-gray-400">
                            Capture mode
                        </p>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setCaptureMode("long")}
                                disabled={loading}
                                className={`flex-1 rounded-xl py-2 px-4 text-sm ${captureMode === "long"
                                    ? "bg-gray-600 text-gray-100"
                                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                    }`}
                            >
                                Long Screenshot
                            </button>

                            <button
                                type="button"
                                onClick={() => setCaptureMode("parts")}
                                disabled={loading}
                                className={`flex-1 rounded-xl py-2 px-4 text-sm ${captureMode === "parts"
                                    ? "bg-gray-600 text-gray-100"
                                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                    }`}
                            >
                                Parted Screenshots
                            </button>
                        </div>
                    </div >

                    <button
                        onClick={handleCapture}
                        disabled={loading}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-xl py-2 px-4"
                    >
                        {loading
                            ? "Capturing..."
                            : "Capture Website"}
                    </button>

                    {
                        error && (
                            <p className="text-red-500 text-sm">
                                {error}
                            </p>
                        )
                    }

                    {
                        result && (
                            <div className="mt-2">
                                <p className="font-semibold truncate">
                                    {result.title || result.name}
                                </p>

                                <p className="text-sm text-gray-400 truncate">
                                    {result.url}
                                </p>
                            </div>
                        )
                    }

                </div >


                {/* Screenshot Panel */}

                < div
                    className={`
                absolute
                top-1/2
                right-0
                -translate-y-1/2

                shrink-0
                w-[34rem]
                h-[44rem]
                bg-gray-900
                rounded-xl
                p-4
                flex flex-col

                transition-all
                duration-700
                ease-in-out

                ${result
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 translate-x-8 pointer-events-none"
                        }
            `}
                >

                    {result && (
                        <>
                            <div className="flex items-center justify-between px-2 pb-3 shrink-0">

                                <div>
                                    <h2 className="font-semibold">
                                        Screenshots
                                    </h2>

                                    <p className="text-xs text-gray-400">
                                        {result.image_urls.length}{" "}
                                        {result.image_urls.length === 1
                                            ? "screenshot"
                                            : "screenshots"}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={downloadAllScreenshots}
                                    className="bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg px-3 py-2 text-xs"
                                >
                                    Download All
                                </button>

                            </div>

                            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">

                                {result.image_urls.map(
                                    (imageUrl, index) => (
                                        <div
                                            key={imageUrl}
                                            className="bg-gray-800 rounded-xl overflow-hidden shrink-0"
                                        >

                                            <div className="px-3 py-2 flex items-center justify-between">

                                                <span className="text-xs text-gray-400">
                                                    Screenshot {index + 1}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        downloadScreenshot(
                                                            imageUrl,
                                                            result.image_names[index] ||
                                                            `screenshot_${index + 1}.png`
                                                        )
                                                    }
                                                    className="text-xs text-gray-400 hover:text-gray-100"
                                                >
                                                    Download
                                                </button>

                                            </div>

                                            <div className="bg-gray-950 p-2">
                                                <img
                                                    src={imageUrl}
                                                    alt={`Screenshot ${index + 1}`}
                                                    className="w-full h-auto rounded-lg block"
                                                />
                                            </div>

                                        </div>
                                    )
                                )}

                            </div>
                        </>
                    )}

                </div >

            </div >

        </div >
    )
}