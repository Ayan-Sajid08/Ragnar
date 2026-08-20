import React from "react"
import NewChatButton from "@/components/NewChatButton"
import { createClient } from "@/lib/supabase/server"
import ProfileButton from "@/components/ProfileButton"
import Image from "next/image"
import ConversationList from "@/components/ConversationsList"

export default async function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    return (
        <div className="flex h-screen">
            <aside className="w-64 h-screen bg-gray-900 text-gray-100 flex flex-col p-4 overflow-hidden">
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

                <h3 className="ml-4 mt-4 text-gray-400 text-xs shrink-0">
                    AI-Powered Document Assistant
                </h3>

                <div className="mt-4 shrink-0">
                    <NewChatButton />
                </div>

                {/* Conversations */}
                <div className="flex-1 min-h-0 mt-4">
                    <ConversationList />
                </div>

                {/* Profile */}
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