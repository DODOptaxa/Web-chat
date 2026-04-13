import { useChatContext } from '../context/ChatContext'

export default function ReplyBar() {
  const { state, setReplyTo } = useChatContext()
  const { replyTo } = state

  if (!replyTo) return null

  const preview = replyTo.text.slice(0, 80) + (replyTo.text.length > 80 ? '…' : '')

  return (
    <div id="reply-bar" className="reply-bar">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 17 4 12 9 7"/>
        <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
      </svg>
      <span id="reply-preview">
        <strong>@{replyTo.userName}</strong>: {preview}
      </span>
      <button id="cancel-reply" title="Отменить ответ" onClick={() => setReplyTo(null)}>✕</button>
    </div>
  )
}
