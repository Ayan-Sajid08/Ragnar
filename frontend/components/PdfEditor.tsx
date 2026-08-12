"use client"

import { useEffect, useRef, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"
import { ZoomIn, ZoomOut } from "lucide-react"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString()

type Props = {
    url: string
}

export default function PdfEditor({ url }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewportRef = useRef<HTMLDivElement>(null)

    const [zoom, setZoom] = useState(1)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setZoom(1)
    }, [url])

    useEffect(() => {
        let cancelled = false

        async function renderPdf() {
            if (!containerRef.current || !viewportRef.current) return

            setLoading(true)
            containerRef.current.innerHTML = ""

            try {
                const pdf = await pdfjsLib.getDocument({ url }).promise

                if (
                    cancelled ||
                    !containerRef.current ||
                    !viewportRef.current
                ) {
                    return
                }

                const container = containerRef.current
                const viewportContainer = viewportRef.current

                const devicePixelRatio =
                    window.devicePixelRatio || 1

                /*
                 * Measure the actual visible PDF viewport ONCE.
                 *
                 * Do not use container.clientWidth here because
                 * the container grows as pages are added.
                 */
                const availableWidth = Math.max(
                    viewportContainer.clientWidth - 32,
                    100
                )

                /*
                 * Every page will use this same available width.
                 */
                for (
                    let pageNumber = 1;
                    pageNumber <= pdf.numPages;
                    pageNumber++
                ) {
                    const page = await pdf.getPage(pageNumber)

                    if (
                        cancelled ||
                        !containerRef.current
                    ) {
                        return
                    }

                    const baseViewport = page.getViewport({
                        scale: 1
                    })

                    const fitScale =
                        availableWidth /
                        baseViewport.width

                    const scale =
                        fitScale * zoom

                    const viewport =
                        page.getViewport({
                            scale
                        })

                    const pageContainer =
                        document.createElement("div")

                    pageContainer.className =
                        "relative mx-auto mb-4 bg-white shadow-lg shrink-0"

                    pageContainer.style.width =
                        `${viewport.width}px`

                    pageContainer.style.height =
                        `${viewport.height}px`

                    const canvas =
                        document.createElement("canvas")

                    const context =
                        canvas.getContext("2d")

                    if (!context) continue

                    /*
                     * Render at device resolution for
                     * high-DPI displays.
                     */
                    const outputScale =
                        devicePixelRatio

                    canvas.width = Math.floor(
                        viewport.width *
                        outputScale
                    )

                    canvas.height = Math.floor(
                        viewport.height *
                        outputScale
                    )

                    /*
                     * Keep the CSS size equal to the
                     * actual PDF viewport size.
                     */
                    canvas.style.width =
                        `${viewport.width}px`

                    canvas.style.height =
                        `${viewport.height}px`

                    canvas.className = "block"

                    pageContainer.appendChild(canvas)
                    container.appendChild(pageContainer)

                    await page.render({
                        canvas,
                        canvasContext: context,
                        viewport,
                        transform:
                            outputScale !== 1
                                ? [
                                    outputScale,
                                    0,
                                    0,
                                    outputScale,
                                    0,
                                    0
                                ]
                                : undefined
                    }).promise
                }

                if (!cancelled) {
                    setLoading(false)
                }

            } catch (error) {
                console.error(
                    "PDF rendering error:",
                    error
                )

                if (containerRef.current) {
                    containerRef.current.innerHTML = `
                        <div class="h-full flex items-center justify-center text-gray-400 text-sm">
                            Unable to render document.
                        </div>
                    `
                }

                setLoading(false)
            }
        }

        renderPdf()

        return () => {
            cancelled = true
        }
    }, [url, zoom])

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

            {/* Zoom controls */}

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

            {/* PDF viewport */}

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