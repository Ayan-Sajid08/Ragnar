"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function NewChatPage() {
    const [title, setTitle] = useState("")
    const [files, setFiles] = useState<File[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
            .catch(() => { })
    }, [])

    function handleFileChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        const selectedFiles = Array.from(e.target.files ?? [])

        setFiles(prev => [
            ...prev,
            ...selectedFiles.filter(
                newFile =>
                    !prev.some(
                        existingFile =>
                            existingFile.name === newFile.name &&
                            existingFile.size === newFile.size
                    )
            )
        ])

        e.target.value = ""
    }

    function removeFile(index: number) {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    async function handleSubmit() {
        setError("")

        if (!title.trim()) {
            setError("Please enter a chat name.")
            return
        }

        if (files.length === 0) {
            setError("Please select at least one PDF.")
            return
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

            // Create the conversation first
            const conversationResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/conversations/`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: title.trim()
                    })
                }
            )

            if (!conversationResponse.ok) {
                throw new Error("Failed to create conversation.")
            }

            const conversation = await conversationResponse.json()
            const conversationId = conversation.id

            // Upload each PDF to the newly created conversation
            for (const file of files) {
                const formData = new FormData()
                formData.append("file", file)

                const uploadResponse = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/documents/upload?conversation_id=${conversationId}`,
                    {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        },
                        body: formData
                    }
                )

                if (!uploadResponse.ok) {
                    throw new Error(
                        `Failed to upload ${file.name}.`
                    )
                }
            }

            router.push(`/chat/${conversationId}`)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."
            )
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-950 flex items-center justify-center h-screen">
            <div className="w-96 bg-gray-900 p-8 rounded-xl flex flex-col gap-4 text-gray-100">

                <h1 className="text-2xl font-bold text-center">
                    New Chat
                </h1>

                <p className="text-center text-gray-400">
                    Create a chat and add your documents.
                </p>

                <input
                    type="text"
                    placeholder="Chat name"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-xl py-2 px-4 outline-none placeholder:text-gray-400"
                />

                <label className="w-full border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 text-gray-400 hover:text-gray-300">
                    <p>Click to select Documents</p>

                    <p className="text-sm mt-1">
                        {files.length === 0
                            ? "No files selected"
                            : `${files.length} file${files.length === 1 ? "" : "s"} selected`}
                    </p>

                    <input
                        type="file"
                        accept=".pdf,.txt,.md,.docx,.pptx,.xlsx,.csv"
                        multiple
                        onChange={handleFileChange}
                        disabled={loading}
                        className="hidden"
                    />
                </label>

                {files.length > 0 && (
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                        {files.map((file, index) => (
                            <div
                                key={`${file.name}-${file.size}-${index}`}
                                className="flex items-center justify-between bg-gray-700 rounded-xl px-3 py-2"
                            >
                                <span className="text-sm text-gray-100 truncate mr-2">
                                    {file.name}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    disabled={loading}
                                    className="text-gray-400 hover:text-gray-100"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-xl py-2 px-4"
                >
                    {loading ? "Creating chat..." : "Create Chat"}
                </button>

                {error && (
                    <p className="text-red-500 text-sm">
                        {error}
                    </p>
                )}

            </div>
        </div>
    )
}