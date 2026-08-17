import React from "react"
import NewChatButton from "@/components/NewChatButton"
import { createClient } from "@/lib/supabase/server"
import ProfileButton from "@/components/ProfileButton"
import DeleteButton from "@/components/ConversationItem";
import Image from "next/image"

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    //fetch conversations for the user
    const { data: conversations } = await supabase.from("conversations").select("*").eq("user_id", user?.id)


    return (
        <div className="flex h-screen">
            <aside className="w-64 h-screen bg-gray-900 text-gray-100 flex flex-col p-4 overflow-hidden">
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                    <header className="flex items-center select-none shrink-0">
                        <Image
                            src="/logo.png"
                            alt="Ragnar Logo"
                            width={50}
                            height={50}
                            priority
                        />

                        <span className="-ml-4 text-2xl font-bold tracking-tight">
                            agnar
                        </span>
                    </header>

                    <h3 className="ml-4 text-gray-400 text-xs shrink-0">
                        AI-Powered Document Assistant
                    </h3>

                    <div className="shrink-0">
                        <NewChatButton />
                    </div>

                    <nav className="flex-1 min-h-0 overflow-y-auto pr-1">
                        {(conversations?.length ?? 0) > 0 ? (
                            <ul className="flex flex-col gap-2">
                                {[...(conversations ?? [])].reverse().map((conversation) => (
                                    <li key={conversation.id}>
                                        <div className="flex items-center gap-1">
                                            <a
                                                href={`/chat/${conversation.id}`}
                                                className="w-full h-12 hover:bg-gray-700 text-gray-300 flex items-center justify-between hover:text-gray-100 rounded-lg py-2 px-4 text-sm"
                                            >
                                                <span className="truncate">
                                                    {conversation.title}
                                                </span>

                                                <DeleteButton
                                                    conversationId={conversation.id}
                                                />
                                            </a>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No conversations yet</p>
                        )}
                    </nav>
                </div>

                <div className="shrink-0 mt-4">
                    <ProfileButton email={user?.email ?? ""} />
                </div>
            </aside>

            <main className="h-screen bg-gray-950 text-gray-100 flex-1">
                {children}
            </main>
        </div>
    )
}