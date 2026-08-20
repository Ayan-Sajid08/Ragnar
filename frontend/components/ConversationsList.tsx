"use client"

import DeleteButton from "@/components/ConversationItem"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

export default function ConversationList() {
    const supabase = createClient()
    const pathname = usePathname()
    const currentChatId = pathname.split("/").pop()

    const [conversations, setConversations] = useState<any[]>([])

    useEffect(() => {
        async function fetchConversations() {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) return

            const { data } = await supabase
                .from("conversations")
                .select("*")
                .eq("user_id", user.id)

            setConversations(data ?? [])
        }

        fetchConversations()
    }, [])

    return (
        <nav className="h-full overflow-y-auto pr-1">
            {(conversations?.length ?? 0) > 0 ? (
                <ul className="flex flex-col gap-2">
                    {[...conversations].reverse().map((conversation) => (
                        <li key={conversation.id}>
                            <div
                                className={`relative h-12 rounded-lg overflow-hidden text-gray-300 hover:bg-gray-700 hover:text-gray-100 ${
                                    currentChatId === conversation.id
                                        ? "bg-gray-700 text-gray-100"
                                        : ""
                                }`}
                            >
                                <a
                                    href={`/chat/${conversation.id}`}
                                    className="w-full h-full flex items-center rounded-lg py-2 pl-4 pr-14 text-sm"
                                >
                                    <span className="truncate">
                                        {conversation.title}
                                    </span>
                                </a>

                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <DeleteButton
                                        conversationId={conversation.id}
                                    />
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No conversations yet</p>
            )}
        </nav>
    )
}