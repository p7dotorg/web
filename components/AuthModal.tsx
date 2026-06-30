"use client"

import { useState } from "react"

export interface AuthUser {
  id?: string
  email: string
  name: string
}

interface Props {
  onSuccess: (user: AuthUser) => void
  onCancel: () => void
}

export default function AuthModal({ onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<"email" | "code" | "name">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isNewUser, setIsNewUser] = useState(false)

  const requestCode = async () => {
    if (!email.includes("@")) { setError("Enter a valid email"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      setLoading(false)
      if (res.ok) {
        setIsNewUser(data.isNewUser ?? false)
        setStep("code")
      } else {
        setError(data.detail ?? data.error ?? "Failed to send code. Try again.")
      }
    } catch {
      setLoading(false)
      setError("Network error. Check your connection.")
    }
  }

  const verifyCode = async (nameOverride?: string) => {
    if (code.length !== 6) { setError("Enter the 6-digit code"); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, name: nameOverride ?? name }),
      })
      const data = await res.json().catch(() => ({}))
      setLoading(false)
      if (res.ok) {
        onSuccess(data)
      } else {
        setError(data.detail ?? data.error ?? "Invalid or expired code")
      }
    } catch {
      setLoading(false)
      setError("Network error.")
    }
  }

  const handleCodeSubmit = async () => {
    if (isNewUser && !name.trim()) {
      setStep("name")
      return
    }
    await verifyCode()
  }

  const steps = {
    email: (
      <>
        <p className="text-[12px] text-[#888e90] mb-3">Enter your email to continue</p>
        <input
          autoFocus
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full h-9 px-3 rounded-lg text-sm text-[#fcfdff] placeholder:text-[#464a4d] focus:outline-none"
          style={{ background: "#06060a", border: "1px solid rgba(255,255,255,0.14)" }}
          onKeyDown={e => { if (e.key === "Enter") requestCode() }}
        />
        {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
        <div className="flex gap-2 mt-3">
          <button
            onClick={requestCode}
            disabled={loading}
            className="flex-1 h-9 rounded-lg text-sm font-medium bg-[#fcfdff] text-black hover:bg-[#f1f7fe] disabled:opacity-30 transition-colors"
          >
            {loading ? "Sending…" : "Send code →"}
          </button>
          <button
            onClick={onCancel}
            className="px-4 h-9 text-[13px] text-[#888e90] hover:text-[#fcfdff] transition-colors rounded-lg"
            style={{ border: "1px solid rgba(255,255,255,0.14)" }}
          >
            Cancel
          </button>
        </div>
      </>
    ),

    code: (
      <>
        <p className="text-[12px] text-[#888e90] mb-1">Check <span className="text-[#fcfdff]">{email}</span></p>
        <p className="text-[11px] text-[#464a4d] mb-3">Enter the 6-digit code we sent you</p>
        <input
          autoFocus
          type="text"
          inputMode="numeric"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="· · · · · ·"
          className="w-full h-11 px-3 rounded-lg text-center text-lg font-mono text-[#fcfdff] placeholder:text-[#464a4d] focus:outline-none tracking-[12px]"
          style={{ background: "#06060a", border: "1px solid rgba(255,255,255,0.14)" }}
          onKeyDown={e => { if (e.key === "Enter") handleCodeSubmit() }}
        />
        {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleCodeSubmit}
            disabled={loading || code.length !== 6}
            className="flex-1 h-9 rounded-lg text-sm font-medium bg-[#fcfdff] text-black hover:bg-[#f1f7fe] disabled:opacity-30 transition-colors"
          >
            {loading ? "Verifying…" : "Confirm →"}
          </button>
          <button
            onClick={() => { setStep("email"); setCode(""); setError("") }}
            className="px-4 h-9 text-[13px] text-[#888e90] hover:text-[#fcfdff] transition-colors rounded-lg"
            style={{ border: "1px solid rgba(255,255,255,0.14)" }}
          >
            Back
          </button>
        </div>
        <button
          onClick={requestCode}
          disabled={loading}
          className="mt-2 text-[11px] text-[#464a4d] hover:text-[#888e90] transition-colors block"
        >
          Resend code
        </button>
      </>
    ),

    name: (
      <>
        <p className="text-[12px] text-[#888e90] mb-1">Welcome to paper7</p>
        <p className="text-[11px] text-[#464a4d] mb-3">What should other readers call you?</p>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name or handle"
          className="w-full h-9 px-3 rounded-lg text-sm text-[#fcfdff] placeholder:text-[#464a4d] focus:outline-none"
          style={{ background: "#06060a", border: "1px solid rgba(255,255,255,0.14)" }}
          onKeyDown={e => { if (e.key === "Enter" && name.trim()) verifyCode(name.trim()) }}
        />
        {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => verifyCode(name.trim() || email.split("@")[0])}
            disabled={loading}
            className="flex-1 h-9 rounded-lg text-sm font-medium bg-[#fcfdff] text-black hover:bg-[#f1f7fe] disabled:opacity-30 transition-colors"
          >
            {loading ? "Creating account…" : "Get started →"}
          </button>
        </div>
      </>
    ),
  }

  return <div className="space-y-0">{steps[step]}</div>
}
