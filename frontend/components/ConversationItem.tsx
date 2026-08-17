"use client"

import { Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function DeleteButton({ conversationId }: { conversationId: string }) {

    const router = useRouter()
    const supabase = createClient()

    async function handleDelete() {

        const confirmed = window.confirm(
            "Are you sure you want to delete this conversation?"
        )

        if (!confirmed) return

        const {
            data: { session }
        } = await supabase.auth.getSession()

        const token = session?.access_token

        if (!token) {
            return
        }

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/conversations/${conversationId}`,
            {
                method: "DELETE",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        )

        if (response.ok) {
            router.push("/new_chat")
            router.refresh()
        }
    }

    return (
        <button
            onClick={handleDelete}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-900/50 text-gray-300 hover:text-red-400 transition"
        >
            <Trash2 size={16} />
        </button>
    )
}