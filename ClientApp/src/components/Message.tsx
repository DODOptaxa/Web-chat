import { useState, useRef } from 'react'
import type { MessageDto } from '../types'
import { useChatContext } from '../context/ChatContext'

function escapeHtml(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function nameToColor(name: string) {
  let hash = 0
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  return `hsl(${((hash % 360) + 360) % 360}, 55%, 58%)`
}

interface Props {
  msg: MessageDto
  currentUser: string
  onReply: (msg: MessageDto) => void
  onReact: (msgId: number) => void
  onScrollTo: (msgId: number) => void
}

export default function Message({ msg, currentUser, onReply, onReact, onScrollTo }: Props) {
  const { toggleReaction } = useChatContext()
  const isOwn = msg.userName === currentUser
  const isSystem = msg.userName === '__system__'
  const [actionsVisible, setActionsVisible] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  if (isSystem) {
    return <div className="message system">{msg.text}</div>
  }

  const time = new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStartRef.current
    if (!start) return
    const dx = Math.abs(e.changedTouches[0].clientX - start.x)
    const dy = Math.abs(e.changedTouches[0].clientY - start.y)
    if (dx < 8 && dy < 8) {
      const target = e.target as HTMLElement
      if (!target.closest('.msg-action-btn') && !target.closest('.reply-quote') && !target.closest('.reaction-pill')) {
        setActionsVisible(v => !v)
      }
    }
    touchStartRef.current = null
  }

  return (
    <div
      className={`message${isOwn ? ' own' : ''}${actionsVisible ? ' actions-visible' : ''}`}
      data-msg-id={msg.id}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Inline actions */}
      <div className="msg-actions">
        <button className="msg-action-btn msg-reply-btn" onClick={() => onReply(msg)}>↩ Ответить</button>
        <button className="msg-action-btn msg-react-btn" onClick={() => onReact(msg.id)}>😊 Реакция</button>
      </div>

      {/* Header: username + time */}
      <div className="msg-header">
        <span className="msg-user" style={{ color: isOwn ? undefined : nameToColor(msg.userName) }}>
          {msg.userName}
        </span>
        <span className="msg-time">{time}</span>
      </div>

      {/* Reply quote */}
      {msg.replyToId && (msg.replyToUserName || msg.replyToText) && (
        <div className="reply-quote" onClick={() => onScrollTo(msg.replyToId!)}>
          <div className="reply-quote-user">↩ {msg.replyToUserName || ''}</div>
          {(msg.replyToText || '').slice(0, 120)}
        </div>
      )}

      {/* Text */}
      <span className="msg-text">{msg.text}</span>

      {/* Reactions */}
      {msg.reactions && msg.reactions.length > 0 && (
        <div className="reactions">
          {msg.reactions.map(r => {
            const isMine = r.users?.includes(currentUser)
            const title = r.users?.join(', ') || ''
            return (
              <span
                key={r.emoji}
                className={`reaction-pill${isMine ? ' mine' : ''}`}
                title={title}
                onClick={() => toggleReaction(msg.id, r.emoji)}
              >
                <span className="reaction-emoji">{r.emoji}</span>
                <span className="reaction-count">{r.count}</span>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
