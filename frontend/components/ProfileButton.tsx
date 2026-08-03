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
                className="border-t border-gray-700 pt-4 w-full text-left h"
            >
                <p className="text-gray-400 text-lg hover:text-gray-100">Profile</p>
            </button>

            {open && (
                <div className="flex flex-col gap-2 mt-2">
                    <p className="text-gray-400 text-xs truncate">{email}</p>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-100 rounded-lg py-2 px-4 text-sm"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    )
}