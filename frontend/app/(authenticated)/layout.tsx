import React from "react"
import NewUploadButton from "@/components/NewUploadButton"
import { createClient } from "@/lib/supabase/server"
import ProfileButton from "@/components/ProfileButton"

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    //fetch conversations for the user
    const { data: conversations } = await supabase.from("conversations").select("*").eq("user_id", user?.id)


    return (
        <div className="flex h-screen">
            <aside className="w-64 h-screen bg-gray-900 text-gray-100 flex flex-col justify-between p-4">
                <div className="flex flex-col gap-4">
                    <header className="text-lg font-bold">Ragnar</header>
                    <NewUploadButton />
                    <nav>
                        {(conversations?.length ?? 0) > 0 ? (
                            <ul className="flex flex-col gap-2">
                                {(conversations ?? []).map((conversation) => (
                                    <li key={conversation.id}>
                                        <a
                                            href={`/chat/${conversation.id}`}
                                            className="block w-full hover:bg-gray-700 text-gray-300 hover:text-gray-100 rounded-lg py-2 px-4 text-sm truncate"
                                        >
                                            {conversation.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No conversations yet</p>
                        )}
                    </nav>
                </div>

                <ProfileButton email={user?.email ?? ""} />
            </aside>

            <main className="h-screen bg-gray-950 text-gray-100 flex-1">
                {children}
            </main>
        </div>
    )
}