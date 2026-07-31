"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const router = useRouter()

    async function handleSubmit() {
        const supabase = createClient()
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (authError) {
            setError("Incorrect email or password.")
            return
        }
        router.push("/dashboard")
    }

    return (
        <div className="h-screen bg-gray-950 flex items-center justify-center">
            <div className="w-96 bg-gray-900 rounded-xl p-8 flex flex-col gap-4 text-gray-100">
                <h1 className="text-2xl font-bold">Login to Ragnar</h1>

                <label>Email</label>
                <input
                    className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-100 outline-none w-full"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <label>Password</label>
                <input
                    className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-gray-100 outline-none w-full"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    onClick={handleSubmit}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg py-2 px-4"
                >
                    Login
                </button>

                {error && <p className="text-red-500">{error}</p>}

                <a
                    href="/register"
                    className="text-gray-400 text-sm text-center hover:text-gray-300"
                >
                    Don't have an account? Register
                </a>
            </div>
        </div>
    )
}