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
        <div>
            <h1>Login to Ragnar</h1>

            <label>Email</label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <label>Password</label>
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleSubmit}>Login</button>

            {error && <p>{error}</p>}

            <a href="/register">Don't have an account? Register</a>
        </div>
    )
}