"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react";
import { useRef, useEffect } from "react"

export default function ProfileButton({ email }: { email: string }) {
    const supabase = createClient()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push("/login")
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="border-t border-gray-700 pt-4 w-full text-left"
            >
                <div className="flex items-center justify-between text-gray-400 hover:text-gray-100">
                    <p className="text-lg">
                        Profile
                    </p>

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
                        />
                    </svg>
                </div>
            </button>

            {open && (
                <div className="flex flex-col gap-2 mt-2">
                    <p className="text-gray-400 text-xs truncate">{email}</p>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition rounded-lg py-2 px-4 text-sm"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    )
}