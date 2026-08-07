"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function UploadPage() {

    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
            .catch(() => { })
    }, [])

    async function handleSubmit() {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!file) {
            setError("File missing or of incorrect format.")
            return
        }
        setLoading(true)
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/upload`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        })

        if (!response.ok) {
            setError("Upload failed. Please try again.")
            setLoading(false)
            return
        }

        const data = await response.json()
        setLoading(false)
        window.location.href = `/chat/${data.conversation_id}`
        router.push(`/chat/${data.conversation_id}`)
    }

    return (
        <div className="h-screen bg-gray-950 flex items-center justify-center">
            <div className="w-96 p-8 flex flex-col gap-4 text-gray-100">
                <h1 className="text-2xl font-bold text-center">
                    Upload Files
                </h1>
                <p className="text-center py-2">
                    Only PDF files are uploadable.
                </p>
                <label className="w-full border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 text-gray-400 hover:text-gray-300">
                    <p>Click to select a PDF</p>
                    <p className="text-sm mt-1">{file ? file.name : "No file selected"}</p>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                    />
                </label>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg py-2 px-4"
                >
                    {loading ? "Uploading..." : "Upload"}
                </button>
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
        </div>
    )

}