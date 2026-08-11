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

        router.push("/new_chat")
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

    async function handleGithubLogin() {
        const supabase = createClient()

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            setError(error.message)
        }
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
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleSubmit();
                        }
                    }}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    onClick={handleSubmit}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg py-2 px-4"
                >
                    Login
                </button>

                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-700"></div>
                    <span className="text-xs text-gray-400">OR</span>
                    <div className="flex-1 h-px bg-gray-700"></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white hover:bg-gray-100 text-black rounded-lg py-2 px-4 flex items-center justify-center gap-3"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-5 h-5"
                    >
                        <path fill="#ffffff" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.9-6.9C35.95 2.5 30.4 0 24 0 14.64 0 6.56 5.38 2.6 13.22l8.04 6.24C12.56 13.62 17.8 9.5 24 9.5z" />
                        <path fill="#ffffff" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.66c-.55 2.95-2.22 5.45-4.72 7.13l7.3 5.66C43.8 37.4 46.5 31.53 46.5 24.5z" />
                        <path fill="#ffffff" d="M10.64 28.54A14.45 14.45 0 0 1 9.5 24c0-1.58.27-3.1.76-4.54L2.22 13.22A24 24 0 0 0 0 24c0 3.88.93 7.54 2.22 10.78l8.42-6.24z" />
                        <path fill="#ffffff" d="M24 48c6.48 0 11.92-2.14 15.9-5.82l-7.3-5.66c-2.03 1.36-4.63 2.16-8.6 2.16-6.2 0-11.44-4.12-13.36-9.96L2.6 34.78C6.56 42.62 14.64 48 24 48z" />
                    </svg>

                    Continue with Google
                </button>

                <button
                    onClick={handleGithubLogin}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg py-2 px-4 flex items-center justify-center gap-3 border border-gray-700"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        className="w-5 h-5 fill-current"
                    >
                        <path d="M8 0C3.58 0 0 3.58 0 8a8.001 8.001 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.53 7.53 0 012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.001 8.001 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>

                    Continue with GitHub
                </button>

                {error && <p className="text-red-500 text-sm">{error}</p>}

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