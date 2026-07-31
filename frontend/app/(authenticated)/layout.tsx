import React from "react"

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <aside>
                <header>Ragnar</header>
                
                <button>New Upload</button>

                <nav>
                    <p>No conversations yet</p>
                </nav>
                
                <footer>
                    <p>Profile</p>
                </footer>
            </aside>
            
            <main>
                {children}
            </main>
        </div>
    )
}