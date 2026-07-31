import React from "react"
import NewUploadButton from "@/components/NewUploadButton"

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen">
            <aside className="w-64 h-screen bg-gray-900 text-gray-100 flex flex-col justify-between p-4">
                <div className="flex flex-col gap-4">
                    <header className="text-lg font-bold">Ragnar</header>
                    <NewUploadButton />
                    <nav>
                        <p>No conversations yet</p>
                    </nav>
                </div>
                
                <footer className="border-t border-gray-700 pt-4">
                    <p className="text-gray-400 text-sm">Profile</p>
                </footer>
            </aside>
            
            <main className="h-screen bg-gray-950 text-gray-100 flex-1">
                {children}
            </main>
        </div>
    )
}