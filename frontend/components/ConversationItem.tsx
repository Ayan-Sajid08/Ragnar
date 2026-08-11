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
            className="flex items-center gap-2 hover:bg-gray-600 text-gray-100 rounded-lg py-2 px-4 text-sm font-semibold"
        >
            <Trash2 size={16} />
        </button>
    )
}