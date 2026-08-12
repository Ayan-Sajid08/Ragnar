"use client"

import { useEffect, useState } from "react"
import { ZoomIn, ZoomOut } from "lucide-react"
import { usePdfRenderer } from "./usePdfRenderer"

type Props = {
    url: string
}

export default function PdfViewer({ url }: Props) {
    const [zoom, setZoom] = useState(1)

    const {
        containerRef,
        viewportRef,
        loading
    } = usePdfRenderer(url, zoom)

    useEffect(() => {
        setZoom(1)
    }, [url])

    function zoomIn() {
        setZoom(prev =>
            Math.min(prev + 0.1, 3)
        )
    }

    function zoomOut() {
        setZoom(prev =>
            Math.max(prev - 0.1, 0.5)
        )
    }

    return (
        <div className="relative w-full h-full min-w-0 min-h-0 overflow-hidden bg-gray-950">

            <div className="absolute top-3 right-3 z-50 flex items-center gap-1 bg-gray-800/95 border border-gray-700 rounded-lg p-1 shadow-lg">

                <button
                    type="button"
                    onClick={zoomOut}
                    disabled={zoom <= 0.5}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-gray-300 hover:bg-gray-700 disabled:text-gray-600 transition"
                    title="Zoom out"
                >
                    <ZoomOut size={16} />
                </button>

                <div className="px-2 min-w-14 text-center text-xs text-gray-300">
                    {Math.round(zoom * 100)}%
                </div>

                <button
                    type="button"
                    onClick={zoomIn}
                    disabled={zoom >= 3}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-gray-300 hover:bg-gray-700 disabled:text-gray-600 transition"
                    title="Zoom in"
                >
                    <ZoomIn size={16} />
                </button>

            </div>

            <div
                ref={viewportRef}
                className="absolute inset-0 overflow-auto"
            >
                <div
                    ref={containerRef}
                    className="min-w-full min-h-full w-max bg-gray-950 p-4"
                />
            </div>

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-sm text-gray-400">
                        Loading document...
                    </div>
                </div>
            )}

        </div>
    )
}