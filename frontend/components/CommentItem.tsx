"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth"
import CommentForm from "./CommentForm"

const API_URL = ""

interface Comment {
  id: number
  user: { username: string; display_name?: string; avatar_url?: string }
  content: string
  likes_count: number
  dislikes_count: number
  user_vote?: string
  created_at: string
  replies?: Comment[]
}

interface Props {
  comment: Comment
  eventId: number
  depth?: number
  onRefresh: () => void
}

export default function CommentItem({ comment, eventId, depth = 0, onRefresh }: Props) {
  const { user, token } = useAuth()
  const [replying, setReplying] = useState(false)
  const [votes, setVotes] = useState({ likes: comment.likes_count, dislikes: comment.dislikes_count, userVote: comment.user_vote })

  const vote = async (type: "like" | "dislike") => {
    if (!token) return
    await fetch(`${API_URL}/api/comments/${comment.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ vote_type: type }),
    })
    setVotes(prev => {
      const removing = prev.userVote === type
      return {
        likes: prev.likes + (type === "like" ? (removing ? -1 : 1) : (prev.userVote === "like" ? -1 : 0)),
        dislikes: prev.dislikes + (type === "dislike" ? (removing ? -1 : 1) : (prev.userVote === "dislike" ? -1 : 0)),
        userVote: removing ? undefined : type,
      }
    })
  }

  const timeAgo = (d: string) => {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (m < 60) return `${m}dk once`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}sa once`
    return `${Math.floor(h / 24)}g once`
  }

  const name = comment.user?.display_name || comment.user?.username || "Anonim"

  return (
    <div style={{ marginLeft: depth > 0 ? 24 : 0, marginTop: 12 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: "var(--color-surface-2)", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "var(--color-text-2)",
          backgroundImage: comment.user?.avatar_url ? `url(${comment.user.avatar_url})` : undefined,
          backgroundSize: "cover",
        }}>
          {!comment.user?.avatar_url && name[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{name}</span>
            <span style={{ fontSize: 11, color: "var(--color-text-3)" }} suppressHydrationWarning>{timeAgo(comment.created_at)}</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-2)", lineHeight: 1.6, marginBottom: 6 }}>
            {comment.content}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={() => vote("like")} style={{
              background: "none", border: "none", cursor: "pointer", fontSize: 12, display: "flex", gap: 3, alignItems: "center",
              color: votes.userVote === "like" ? "var(--color-accent)" : "var(--color-text-3)",
            }}>
              👍 {votes.likes > 0 ? votes.likes : ""}
            </button>
            <button onClick={() => vote("dislike")} style={{
              background: "none", border: "none", cursor: "pointer", fontSize: 12, display: "flex", gap: 3, alignItems: "center",
              color: votes.userVote === "dislike" ? "#ef4444" : "var(--color-text-3)",
            }}>
              👎 {votes.dislikes > 0 ? votes.dislikes : ""}
            </button>
            {user && depth < 3 && (
              <button onClick={() => setReplying(!replying)} style={{
                background: "none", border: "none", cursor: "pointer", fontSize: 12,
                color: "var(--color-text-3)", fontWeight: 500,
              }}>
                Yanit
              </button>
            )}
          </div>
          {replying && (
            <div style={{ marginTop: 10 }}>
              <CommentForm eventId={eventId} parentId={comment.id} onSubmit={() => { setReplying(false); onRefresh() }} onCancel={() => setReplying(false)} />
            </div>
          )}
        </div>
      </div>
      {comment.replies?.map(r => (
        <CommentItem key={r.id} comment={r} eventId={eventId} depth={depth + 1} onRefresh={onRefresh} />
      ))}
    </div>
  )
}
