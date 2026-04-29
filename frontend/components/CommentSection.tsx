"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth"
import { CommentData, getComments, postComment, voteComment, deleteComment } from "@/lib/api"
import { timeAgo } from "@/lib/utils"

function CommentForm({ onSubmit, placeholder, autoFocus }: {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  autoFocus?: boolean
}) {
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  async function handle() {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await onSubmit(text.trim())
      setText("")
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder || "Yorumunuzu yazın..."}
        autoFocus={autoFocus}
        style={{
          flex: 1, minHeight: 60, padding: "10px 14px", fontSize: 13,
          background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)", color: "var(--color-text)",
          resize: "vertical", outline: "none", lineHeight: 1.5,
        }}
        onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handle() }}
      />
      <button
        onClick={handle}
        disabled={!text.trim() || sending}
        style={{
          padding: "10px 16px", fontSize: 13, fontWeight: 600,
          background: text.trim() ? "var(--color-accent)" : "var(--color-surface-2)",
          color: text.trim() ? "#fff" : "var(--color-text-3)",
          border: "none", borderRadius: "var(--radius-md)",
          cursor: text.trim() ? "pointer" : "default",
          alignSelf: "flex-end", whiteSpace: "nowrap",
        }}
      >
        {sending ? "..." : "Gönder"}
      </button>
    </div>
  )
}

function CommentItem({ comment, eventId, depth, userId, onUpdate }: {
  comment: CommentData
  eventId: number
  depth: number
  userId?: number
  onUpdate: () => void
}) {
  const [showReply, setShowReply] = useState(false)
  const [likes, setLikes] = useState(comment.likes_count)
  const [dislikes, setDislikes] = useState(comment.dislikes_count)
  const [userVote, setUserVote] = useState(comment.user_vote)

  async function handleVote(type: "like" | "dislike") {
    try {
      const res = await voteComment(comment.id, type)
      setLikes(res.likes_count)
      setDislikes(res.dislikes_count)
      setUserVote(res.user_vote)
    } catch { /* ignore */ }
  }

  async function handleReply(content: string) {
    await postComment(eventId, content, comment.id)
    setShowReply(false)
    onUpdate()
  }

  async function handleDelete() {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return
    await deleteComment(comment.id)
    onUpdate()
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 24 : 0, marginTop: depth > 0 ? 10 : 0 }}>
      <div style={{
        padding: "14px 16px",
        background: depth > 0 ? "transparent" : "var(--color-surface)",
        border: depth > 0 ? "none" : "1px solid var(--color-border)",
        borderLeft: depth > 0 ? "2px solid var(--color-border)" : "none",
        borderRadius: depth > 0 ? 0 : "var(--radius-md)",
        paddingLeft: depth > 0 ? 16 : 16,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "#fff",
          }}>
            {comment.user.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
            {comment.user.name}
          </span>
          <span style={{ fontSize: 11, color: "var(--color-text-3)" }} suppressHydrationWarning>
            {timeAgo(comment.created_at)}
          </span>
        </div>

        {/* Content */}
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-text-2)", marginBottom: 10 }}>
          {comment.content}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
          <button onClick={() => handleVote("like")} style={{
            background: "none", border: "none", cursor: "pointer",
            color: userVote === "like" ? "var(--color-accent)" : "var(--color-text-3)",
            display: "flex", alignItems: "center", gap: 4, fontSize: 12,
          }}>
            👍 {likes}
          </button>
          <button onClick={() => handleVote("dislike")} style={{
            background: "none", border: "none", cursor: "pointer",
            color: userVote === "dislike" ? "#ef4444" : "var(--color-text-3)",
            display: "flex", alignItems: "center", gap: 4, fontSize: 12,
          }}>
            👎 {dislikes}
          </button>
          {depth < 2 && (
            <button onClick={() => setShowReply(s => !s)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-text-3)", fontSize: 12,
            }}>
              Yanıtla
            </button>
          )}
          {userId === comment.user.id && (
            <button onClick={handleDelete} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#ef4444", fontSize: 12,
            }}>
              Sil
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReply && (
          <div style={{ marginTop: 10 }}>
            <CommentForm onSubmit={handleReply} placeholder="Yanıtınızı yazın..." autoFocus />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies?.map(reply => (
        <CommentItem
          key={reply.id}
          comment={reply}
          eventId={eventId}
          depth={depth + 1}
          userId={userId}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  )
}

export default function CommentSection({ eventId }: { eventId: number }) {
  const { user } = useAuth()
  const [comments, setComments] = useState<CommentData[]>([])
  const [total, setTotal] = useState(0)
  const [sort, setSort] = useState("newest")
  const [loading, setLoading] = useState(true)

  const loadComments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getComments(eventId, sort)
      setComments(data.comments)
      setTotal(data.total)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [eventId, sort])

  useEffect(() => { loadComments() }, [loadComments])

  async function handlePost(content: string) {
    await postComment(eventId, content)
    loadComments()
  }

  return (
    <div style={{
      marginTop: 24,
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "20px 20px 24px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, flexWrap: "wrap", gap: 10,
      }}>
        <h3 style={{
          fontSize: 14, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.05em", color: "var(--color-text-2)",
        }}>
          💬 Yorumlar ({total})
        </h3>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{
            padding: "6px 10px", fontSize: 12,
            background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)", color: "var(--color-text-2)",
            cursor: "pointer", outline: "none",
          }}
        >
          <option value="newest">En Yeni</option>
          <option value="popular">En Popüler</option>
        </select>
      </div>

      {/* Comment form */}
      {user ? (
        <div style={{ marginBottom: 24 }}>
          <CommentForm onSubmit={handlePost} />
        </div>
      ) : (
        <div style={{
          padding: "16px 20px", marginBottom: 24,
          background: "var(--color-surface)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)", textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "var(--color-text-3)", marginBottom: 10 }}>
            Yorum yapmak için giriş yapın
          </p>
          <Link href="/giris" style={{
            fontSize: 13, fontWeight: 600, color: "var(--color-accent)", textDecoration: "none",
          }}>
            Giriş Yap →
          </Link>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-3)", fontSize: 13 }}>
          Yorumlar yükleniyor...
        </div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-3)", fontSize: 13 }}>
          Henüz yorum yapılmamış. İlk yorumu siz yazın!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {comments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              eventId={eventId}
              depth={0}
              userId={user?.id}
              onUpdate={loadComments}
            />
          ))}
        </div>
      )}
    </div>
  )
}
