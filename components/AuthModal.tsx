"use client"

import { useState } from "react"

export interface AuthUser {
  email: string
  name: string
}

interface Props {
  onSuccess: (user: AuthUser) => void
  onCancel: () => void
}

export default function AuthModal({ onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
        setStep("code")
      } else {
        setError(data.detail ?? data.error ?? "Failed to send code. Try again.")
      }
    } catch {
      setLoading(false)
      setError("Network error. Check your connection.")
    }
  }

  const verifyCode = async () => {
    if (code.length !== 6) { setError("Enter the 6-digit code"); return }
    setLoading(true); setError("")
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    })
    setLoading(false)
    if (res.ok) {
      const user = await res.json()
      onSuccess(user)
    } else {
      setError("Invalid or expired code")
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] text-[#888e90]">
        {step === "email" ? "Enter your email to continue" : `Code sent to ${email}`}
      </p>

      {step === "email" ? (
        <>
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
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={requestCode}
              disabled={loading}
              className="flex-1 h-9 rounded-lg text-sm font-medium bg-[#fcfdff] text-black hover:bg-[#f1f7fe] disabled:opacity-30 transition-colors"
            >
              {loading ? "Sending…" : "Send code"}
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
      ) : (
        <>
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full h-9 px-3 rounded-lg text-sm text-[#fcfdff] placeholder:text-[#464a4d] focus:outline-none tracking-[8px]"
            style={{ background: "#06060a", border: "1px solid rgba(255,255,255,0.14)" }}
            onKeyDown={e => { if (e.key === "Enter") verifyCode() }}
          />
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="flex-1 h-9 rounded-lg text-sm font-medium bg-[#fcfdff] text-black hover:bg-[#f1f7fe] disabled:opacity-30 transition-colors"
            >
              {loading ? "Verifying…" : "Confirm"}
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
            className="text-[11px] text-[#464a4d] hover:text-[#888e90] transition-colors"
          >
            Resend code
          </button>
        </>
      )}
    </div>
  )
}
