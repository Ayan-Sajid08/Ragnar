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
        router.push("/upload")
    }

    async function handleGoogleLogin() {
        const supabase = createClient()

        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
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

                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white hover:bg-gray-100 text-black rounded-lg py-2 px-4 flex items-center justify-center gap-3"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-5 h-5"
                    >
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.9-6.9C35.95 2.5 30.4 0 24 0 14.64 0 6.56 5.38 2.6 13.22l8.04 6.24C12.56 13.62 17.8 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.66c-.55 2.95-2.22 5.45-4.72 7.13l7.3 5.66C43.8 37.4 46.5 31.53 46.5 24.5z" />
                        <path fill="#FBBC05" d="M10.64 28.54A14.45 14.45 0 0 1 9.5 24c0-1.58.27-3.1.76-4.54L2.22 13.22A24 24 0 0 0 0 24c0 3.88.93 7.54 2.22 10.78l8.42-6.24z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.92-2.14 15.9-5.82l-7.3-5.66c-2.03 1.36-4.63 2.16-8.6 2.16-6.2 0-11.44-4.12-13.36-9.96L2.6 34.78C6.56 42.62 14.64 48 24 48z" />
                    </svg>

                    Continue with Google
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