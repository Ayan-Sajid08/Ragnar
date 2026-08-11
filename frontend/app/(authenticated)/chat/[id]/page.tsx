"use client"

import { useState, useEffect, useRef, use } from "react"
import { createClient } from "@/lib/supabase/client"
import ReactMarkdown from "react-markdown"
import dynamic from "next/dynamic"

const PdfViewer = dynamic(
    () => import("@/components/PdfViewer"),
    { ssr: false }
)

type Message = {
    role: string
    content: string
}

type Document = {
    id: string
    name: string
    file_url: string
    file_type: string
}

export default function ChatPage({
    params
}: {
    params: Promise<{ id: string }>
}) {

    const { id } = use(params)

    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    const [splitView, setSplitView] = useState(false)

    const [chatTitle, setChatTitle] = useState("Chat")
    const [editingTitle, setEditingTitle] = useState(false)
    const [titleInput, setTitleInput] = useState("Chat")
    const [savingTitle, setSavingTitle] = useState(false)

    const [documents, setDocuments] = useState<Document[]>([])
    const [selectedDocument, setSelectedDocument] =
        useState<Document | null>(null)

    const [pdfUrl, setPdfUrl] = useState("")
    const [loadingPdf, setLoadingPdf] = useState(false)

    const supabase = createClient()
    const bottomRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    // -------------------------
    // Fetch conversation
    // -------------------------

    async function fetchConversation() {

        const { data, error } = await supabase
            .from("conversations")
            .select("title")
            .eq("id", id)
            .single()

        if (error) {
            console.error("Error fetching conversation:", error)
            return
        }

        if (data) {
            setChatTitle(data.title || "Chat")
        }
    }

    // -------------------------
    // Fetch messages
    // -------------------------

    async function fetchMessages() {

        const { data, error } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", id)
            .order("created_at", { ascending: true })

        if (error) {
            console.error("Error fetching messages:", error)
            return
        }

        if (data) {
            setMessages(
                data.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            )
        }
    }


    // -------------------------
    // Fetch documents
    // -------------------------

    async function fetchDocuments() {

        const { data, error } = await supabase
            .from("documents")
            .select("id, name, file_url, file_type")
            .eq("conversation_id", id)
            .order("created_at", { ascending: true })

        if (error) {
            console.error("Error fetching documents:", error)
            return
        }

        if (data) {
            setDocuments(data)
        }
    }


    // -------------------------
    // Open document
    // -------------------------

    async function openDocument(document: Document) {

        setSelectedDocument(document)
        setPdfUrl("")
        setLoadingPdf(true)

        const { data, error } = await supabase.storage
            .from("documents")
            .createSignedUrl(document.file_url, 3600)

        if (error) {
            console.error("Error creating signed URL:", error)
            setLoadingPdf(false)
            return
        }

        if (data?.signedUrl) {
            setPdfUrl(data.signedUrl)
        }

        setLoadingPdf(false)
    }


    // -------------------------
    // Initial loading
    // -------------------------

    useEffect(() => {
        fetchMessages()
        fetchDocuments()
        fetchConversation()
    }, [id])


    // -------------------------
    // Scroll to bottom
    // -------------------------

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: "smooth"
        })
    }, [messages])

    // -------------------------
    // Upload document
    // -------------------------

    async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {

        const file = event.target.files?.[0]

        if (!file) {
            return
        }

        if (file.type !== "application/pdf") {
            alert("Please select a PDF file.")
            event.target.value = ""
            return
        }

        const {
            data: { session }
        } = await supabase.auth.getSession()

        const token = session?.access_token

        if (!token) {
            alert("You are not authenticated.")
            event.target.value = ""
            return
        }

        setUploading(true)

        try {

            const formData = new FormData()

            formData.append("file", file)

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/documents/upload?conversation_id=${encodeURIComponent(id)}`,
                {
                    method: "POST",

                    headers: {
                        "Authorization": `Bearer ${token}`
                    },

                    body: formData
                }
            )

            if (!response.ok) {

                const errorText = await response.text()

                console.error("Upload failed:", errorText)

                alert("Failed to upload document.")

                return
            }

            await response.json()

            // Refresh document list
            await fetchDocuments()

        } catch (error) {

            console.error("Upload error:", error)

            alert("Something went wrong while uploading the document.")

        } finally {

            setUploading(false)

            // Allow selecting the same file again
            event.target.value = ""

        }
    }

    // -------------------------
    // Rename conversation
    // -------------------------

    async function saveTitle() {

        const newTitle = titleInput.trim()

        if (!newTitle || savingTitle) {
            return
        }

        const {
            data: { session }
        } = await supabase.auth.getSession()

        const token = session?.access_token

        if (!token) {
            console.error("Not authenticated")
            return
        }

        setSavingTitle(true)

        try {

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/conversations/${id}`,
                {
                    method: "PATCH",

                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        title: newTitle
                    })
                }
            )

            if (!response.ok) {
                console.error("Failed to rename conversation")
                return
            }

            const data = await response.json()

            setChatTitle(data.title || newTitle)
            setEditingTitle(false)

        } catch (error) {

            console.error("Rename error:", error)

        } finally {

            setSavingTitle(false)

        }
    }

    // -------------------------
    // Send message
    // -------------------------

    async function handleSubmit() {

        if (!input.trim() || loading) {
            return
        }

        const content = input.trim()

        const {
            data: { session }
        } = await supabase.auth.getSession()

        const token = session?.access_token

        if (!token) {
            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: "You are not authenticated."
                }
            ])

            return
        }

        setMessages(prev => [
            ...prev,
            {
                role: "user",
                content
            }
        ])

        setInput("")
        setLoading(true)

        try {

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/messages/`,
                {
                    method: "POST",

                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        conversation_id: id,
                        content
                    })
                }
            )

            if (!response.ok) {

                setMessages(prev => [
                    ...prev,
                    {
                        role: "assistant",
                        content: "Something went wrong, please try later."
                    }
                ])

                return
            }

            const data = await response.json()

            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: data.response
                }
            ])

        } catch (error) {

            console.error("Message error:", error)

            setMessages(prev => [
                ...prev,
                {
                    role: "assistant",
                    content: "Something went wrong, please try later."
                }
            ])

        } finally {
            setLoading(false)
        }
    }


    return (

        <div className="h-screen bg-gray-950 flex">


            {/* =========================
                CHAT
            ========================= */}

            <div
                className={`h-full flex flex-col transition-all duration-300 ${splitView
                    ? "flex-1"
                    : "w-full max-w-4xl mx-auto"
                    }`}
            >


                {/* Header */}

                <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">

                    <div className="group flex items-center gap-2">

                        {editingTitle ? (

                            <input
                                autoFocus
                                type="text"
                                value={titleInput}
                                onChange={(e) => setTitleInput(e.target.value)}
                                onKeyDown={(e) => {

                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        saveTitle()
                                    }

                                    if (e.key === "Escape") {
                                        setEditingTitle(false)
                                        setTitleInput(chatTitle)
                                    }

                                }}
                                disabled={savingTitle}
                                className="text-2xl font-bold text-gray-100 bg-transparent border-b border-gray-600 outline-none w-[300px]"
                            />

                        ) : (

                            <>
                                <h1 className="text-2xl font-bold text-gray-100">
                                    {chatTitle}
                                </h1>

                                <button
                                    onClick={() => {
                                        setTitleInput(chatTitle)
                                        setEditingTitle(true)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-200"
                                    title="Edit conversation name"
                                    aria-label="Edit conversation name"
                                >
                                    ✎
                                </button>
                            </>

                        )}

                    </div>

                    <button
                        onClick={() => setSplitView(!splitView)}
                        className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-100"
                    >
                        {splitView
                            ? "Hide Documents"
                            : "Show Documents"}
                    </button>

                </div>


                {/* Messages */}

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

                        <p className="text-gray-400">
                            No messages yet.
                        </p>

                    )}

                </div>


                {/* Input */}

                <div className="border-t border-gray-800 px-6 py-4">

                    <div className="flex gap-3">

                        <input
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl py-3 px-4 text-gray-100 outline-none"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {

                                if (e.key === "Enter") {

                                    e.preventDefault()

                                    if (!loading && input.trim()) {
                                        handleSubmit()
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


            {/* =========================
                DOCUMENT PANEL
            ========================= */}

            {splitView && (

                <div className="w-[45%] min-w-[420px] h-full border-l border-gray-800 bg-gray-900 flex flex-col">


                    {/* Document list */}

                    <div className="border-b border-gray-800 p-4">

                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-gray-100">
                                Documents
                            </h2>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-600 text-gray-200 text-xl transition"
                                title="Add document"
                                aria-label="Add document"
                            >
                                {uploading ? (
                                    <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    "+"
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                onChange={handleUpload}
                                className="hidden"
                            />
                        </div>


                        {documents.length === 0 ? (

                            <p className="text-sm text-gray-500">
                                No documents uploaded.
                            </p>

                        ) : (

                            <div className="flex flex-col gap-2">

                                {documents.map(document => (

                                    <button
                                        key={document.id}
                                        onClick={() => openDocument(document)}
                                        className={`w-full text-left px-3 py-3 rounded-lg transition ${selectedDocument?.id === document.id
                                            ? "bg-gray-700 text-gray-100"
                                            : "bg-gray-800 hover:bg-gray-750 text-gray-300"
                                            }`}
                                    >

                                        <div className="flex items-center gap-3">

                                            <span className="text-lg">
                                                📄
                                            </span>

                                            <span className="text-sm truncate">
                                                {document.name}
                                            </span>

                                        </div>

                                    </button>

                                ))}

                            </div>

                        )}

                    </div>


                    {/* PDF viewer */}

                    <div className="flex-1 min-h-0">

                        {!selectedDocument ? (

                            <div className="h-full flex items-center justify-center text-gray-500 text-sm text-center px-6">

                                <div>
                                    <p className="text-gray-400 mb-1">
                                        Select a document
                                    </p>

                                    <p>
                                        Choose a document above to view it.
                                    </p>
                                </div>

                            </div>

                        ) : loadingPdf ? (

                            <div className="h-full flex items-center justify-center text-gray-400">

                                Loading document...

                            </div>

                        ) : pdfUrl ? (

                            <PdfViewer url={pdfUrl} />

                        ) : (

                            <div className="h-full flex items-center justify-center text-gray-400">

                                Unable to load document.

                            </div>

                        )}

                    </div>

                </div>

            )}

        </div>
    )
}