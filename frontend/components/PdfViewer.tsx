"use client"

type Props = {
    url: string
}

export default function PdfViewer({ url }: Props) {
    return (
        <iframe
            src={url}
            className="w-full h-full"
            title="Document Viewer"
        />
    )
}