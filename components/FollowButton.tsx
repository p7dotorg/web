"use client"

import { useState } from "react"

interface Props {
  userId: string
  initialFollowing: boolean
  initialCount: number
  size?: "sm" | "md"
}

export default function FollowButton({ userId, initialFollowing, initialCount, size = "md" }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    const method = following ? "DELETE" : "POST"
    const res = await fetch(`/api/users/${encodeURIComponent(userId)}/follow`, { method })
    if (res.ok) {
      setFollowing(!following)
      setCount(c => following ? c - 1 : c + 1)
    }
    setLoading(false)
  }

  const sm = size === "sm"

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`
        ${sm ? "h-7 px-3 text-[11px]" : "h-8 px-4 text-[12px]"}
        rounded-lg font-medium transition-all shrink-0
        ${following
          ? "text-[#888e90] hover:text-red-400 hover:border-red-400/30"
          : "text-[#fcfdff] hover:bg-[rgba(255,255,255,0.06)]"
        }
      `}
      style={{
        border: following
          ? "1px solid rgba(255,255,255,0.10)"
          : "1px solid rgba(255,255,255,0.20)",
      }}
    >
      {loading ? "..." : following ? `following${count > 0 ? ` · ${count}` : ""}` : "follow"}
    </button>
  )
}
