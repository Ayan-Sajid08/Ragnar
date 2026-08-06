"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { use } from "react"
import ReactMarkdown from "react-markdown"
import { useRef, useEffect } from "react"
import dynamic from "next/dynamic"

const PdfViewer = dynamic(
    () => import("@/components/PdfViewer"),
    { ssr: false }
)

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {

    const { id } = use(params)
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [splitView, setSplitView] = useState(false)
    const [pdfUrl, setPdfUrl] = useState("")
    const supabase = createClient()
    const bottomRef = useRef<HTMLDivElement>(null)

    async function fetchMessages() {
        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", id)
            .order("created_at", { ascending: true })

        if (data) {
            setMessages(data.map(msg => ({
                role: msg.role,
                content: msg.content
            })))
        }
    }

    async function fetchPdfUrl() {
        console.log("Fetching PDF URL for:", id)

        const { data: conversation, error: conversationError } = await supabase
            .from("conversations")
            .select("document_id")
            .eq("id", id)
            .single()

        console.log("Conversation:", conversation)
        console.log("Conversation error:", conversationError)

        if (!conversation) return

        const { data: document, error: documentError } = await supabase
            .from("documents")
            .select("file_url")
            .eq("id", conversation.document_id)
            .single()

        console.log("Document:", document)
        console.log("Document error:", documentError)

        if (!document) return

        const { data, error } = await supabase.storage
            .from("documents")
            .createSignedUrl(document.file_url, 3600)

        console.log("Signed URL:", data)
        console.log("Signed URL error:", error)

        if (data?.signedUrl) {
            setPdfUrl(data.signedUrl)
        }
    }

    useEffect(() => {
        fetchMessages()
        fetchPdfUrl()
    }, [id])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])  // runs every time messages changes

    useEffect(() => {
        console.log(pdfUrl)
    }, [pdfUrl])

    async function handleSubmit() {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        setMessages(prev => [...prev, { role: "user", content: input }])
        setInput("")
        setLoading(true)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                conversation_id: id,
                content: input
            })
        })

        if (!response.ok) {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Something went wrong, please try later."
            }])
            setLoading(false)
            return
        }

        const data = await response.json()
        setMessages(prev => [...prev, { role: "assistant", content: data.response }])
        setLoading(false)
    }

    return (
        <div className="h-screen bg-gray-950 flex">
            <div
                className={`h-full flex flex-col transition-all duration-300 ${splitView ? "w-1/2 border-r border-gray-800" : "w-full max-w-4xl mx-auto"
                    }`}
            >
                <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-100">
                        Chat
                    </h1>

                    <button
                        onClick={() => setSplitView(!splitView)}
                        className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
                    >
                        {splitView ? "Hide Document" : "Show Document"}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6 text-gray-100">
                    {messages.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex ${message.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                        }`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user"
                                            ? "bg-gray-700"
                                            : "bg-gray-900 border border-gray-800"
                                            }`}
                                    >
                                        <p className="text-sm text-gray-400 capitalize">
                                            {message.role}
                                        </p>
                                        <div className="mt-1 prose prose-invert prose-sm max-w-none">
                                            <ReactMarkdown>
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>

                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </div>
                    ) : (
                        <p className="text-gray-400">No messages yet.</p>
                    )}
                </div>

                <div className="border-t border-gray-800 px-6 py-4">
                    <div className="flex gap-3">
                        <input
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-gray-100 outline-none"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();

                                    if (!loading && input.trim()) {
                                        handleSubmit();
                                    }
                                }
                            }}
                            placeholder="Type your message..."
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-gray-100 rounded-xl py-3 px-6 flex items-center justify-center min-w-24"
                        >
                            {loading ? (
                                <div className="h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                "Send"
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {splitView && (
                <div className="w-1/2 h-full bg-gray-900">
                    {pdfUrl ? (
                        <PdfViewer url={pdfUrl} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            Loading document...
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}