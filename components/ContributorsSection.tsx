"use client"

import { useEffect, useState } from "react"
import FollowButton from "./FollowButton"

interface Contributor {
  authorId: string
  authorName: string
  annotationCount: number
  totalUpvotes: number
}

interface FollowState {
  [userId: string]: { isFollowing: boolean; followers: number }
}

export default function ContributorsSection({ contributors }: { contributors: Contributor[] }) {
  const [session, setSession] = useState<{ email: string } | null>(null)
  const [followState, setFollowState] = useState<FollowState>({})

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(u => {
        if (!u?.email) return
        setSession(u)
        // Fetch follow state for all contributors in parallel
        Promise.all(
          contributors
            .filter(c => c.authorId !== u.email)
            .map(c =>
              fetch(`/api/users/${encodeURIComponent(c.authorId)}/follow`)
                .then(r => r.json())
                .then(d => ({ id: c.authorId, isFollowing: d.isFollowing, followers: d.followers }))
                .catch(() => ({ id: c.authorId, isFollowing: false, followers: 0 }))
            )
        ).then(results => {
          const state: FollowState = {}
          results.forEach(r => { state[r.id] = { isFollowing: r.isFollowing, followers: r.followers } })
          setFollowState(state)
        })
      })
      .catch(() => {})
  }, [contributors])

  return (
    <section>
      <p className="text-[10px] font-medium tracking-widest text-[var(--charcoal)] uppercase mb-6">
        Top contributors
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {contributors.map((c, i) => {
          const fs = followState[c.authorId]
          const isSelf = session?.email === c.authorId

          return (
            <div
              key={c.authorId}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "#0a0a0c", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Rank */}
              <span className="text-[11px] text-[var(--charcoal)] w-4 shrink-0 tabular-nums">
                {i + 1}
              </span>
              {/* Avatar → profile */}
              <a href={`/u/${encodeURIComponent(c.authorId)}`}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold text-black shrink-0 hover:opacity-80 transition-opacity"
                style={{ background: "#fcfdff" }}
              >
                {c.authorName[0].toUpperCase()}
              </a>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <a href={`/u/${encodeURIComponent(c.authorId)}`}
                  className="text-[12px] font-medium text-[#fcfdff] truncate hover:underline block"
                >{c.authorName}</a>
                <p className="text-[11px] text-[var(--ash)]">
                  {c.annotationCount} note{c.annotationCount !== 1 ? "s" : ""}
                  {c.totalUpvotes > 0 && (
                    <span className="text-[var(--charcoal)]"> · ▲{c.totalUpvotes}</span>
                  )}
                </p>
              </div>
              {/* Follow button — only when logged in and not self */}
              {session && !isSelf && (
                <FollowButton
                  userId={c.authorId}
                  initialFollowing={fs?.isFollowing ?? false}
                  initialCount={fs?.followers ?? 0}
                  size="sm"
                />
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
