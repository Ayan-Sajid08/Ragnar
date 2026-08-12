"use client"

import { useEffect, useRef, useState } from "react"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString()

export function usePdfRenderer(
    url: string,
    zoom: number
) {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewportRef = useRef<HTMLDivElement>(null)

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        async function renderPdf() {
            if (
                !containerRef.current ||
                !viewportRef.current
            ) {
                return
            }

            setLoading(true)
            containerRef.current.innerHTML = ""

            try {
                const pdf =
                    await pdfjsLib.getDocument({ url }).promise

                if (
                    cancelled ||
                    !containerRef.current ||
                    !viewportRef.current
                ) {
                    return
                }

                const container = containerRef.current
                const viewportContainer =
                    viewportRef.current

                const devicePixelRatio =
                    window.devicePixelRatio || 1

                /*
                 * Measure the actual visible viewport once.
                 * Do NOT use container.clientWidth because
                 * the container grows as pages are added.
                 */
                const availableWidth = Math.max(
                    viewportContainer.clientWidth - 32,
                    100
                )

                for (
                    let pageNumber = 1;
                    pageNumber <= pdf.numPages;
                    pageNumber++
                ) {
                    const page =
                        await pdf.getPage(pageNumber)

                    if (
                        cancelled ||
                        !containerRef.current
                    ) {
                        return
                    }

                    const baseViewport =
                        page.getViewport({
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

    return {
        containerRef,
        viewportRef,
        loading
    }
}