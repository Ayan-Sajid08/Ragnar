"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
    
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")

    async function handleSubmit() {
        const supabase = createClient()
        const { error: authError } = await supabase.auth.signUp({
            email,
            password
        })
        if (authError) {
            setError("Something went wrong. Please try again.")
            return
        }
        else {
            setMessage("Registration successful! Please check your email to verify your account.")
        }
    }

    return (
        <div>
            <h1>Register for Ragnar</h1>

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
            <button onClick={handleSubmit}>Register</button>

            {error && <p>{error}</p>}
            
            {message && <p>{message}</p>}

            <a href="/login">Already have an account? Login</a>
        </div>
    )
}