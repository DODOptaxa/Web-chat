import { useRef } from 'react'
import type { MessageDto } from '../types'
import { useChatContext } from '../context/ChatContext'

function nameToColor(name: string) {
  let hash = 0
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  return `hsl(${((hash % 360) + 360) % 360}, 55%, 58%)`
}

interface Props {
  msg: MessageDto
  currentUser: string
  activeMsgId: number | null
  onSetActive: (id: number | null) => void
  onReply: (msg: MessageDto) => void
  onReact: (msgId: number) => void
  onScrollTo: (msgId: number) => void
}

export default function Message({ msg, currentUser, activeMsgId, onSetActive, onReply, onReact, onScrollTo }: Props) {
  const { toggleReaction } = useChatContext()
  const isOwn = msg.userName === currentUser
  const isSystem = msg.userName === '__system__'
  const isActive = activeMsgId === msg.id
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)

  const isAdmin = msg.userName.includes('🦤')

  if (isSystem) {
    return <div className="message system">{msg.text}</div>
  }

const sentAt = /[Z+]|\d{2}:\d{2}$/.test(msg.sentAt) ? msg.sentAt : msg.sentAt + 'Z'
const time = new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  function handlePointerDown(e: React.PointerEvent) {
    pointerDownRef.current = { x: e.clientX, y: e.clientY }
  }

  function handlePointerUp(e: React.PointerEvent) {
    const start = pointerDownRef.current
    pointerDownRef.current = null
    if (!start) return

    const dx = Math.abs(e.clientX - start.x)
    const dy = Math.abs(e.clientY - start.y)
    if (dx > 8 || dy > 8) return
    const target = e.target as HTMLElement
    if (target.closest('.msg-action-btn') || target.closest('.reply-quote') || target.closest('.reaction-pill')) return

    onSetActive(isActive ? null : msg.id)
  }

  return (
		<div
			className={`message${isOwn ? ' own' : ''}${isActive ? ' actions-visible' : ''}`}
			data-msg-id={msg.id}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
		>
			{/* Inline actions */}
			<div className='msg-actions'>
				<button
					className='msg-action-btn msg-reply-btn'
					onPointerDown={e => e.stopPropagation()}
					onPointerUp={e => {
						e.stopPropagation()
						onSetActive(null)
						onReply(msg)
					}}
				>
					↩ Ответить
				</button>
				<button
					className='msg-action-btn msg-react-btn'
					onPointerDown={e => e.stopPropagation()}
					onPointerUp={e => {
						e.stopPropagation()
						onSetActive(null)
						onReact(msg.id)
					}}
				>
					😊 Реакция
				</button>
			</div>

			{/* Header: username + time */}
			<div className='msg-header'>
				<span
					className='msg-user'
					style={{ color: isOwn ? undefined : nameToColor(msg.userName) }}
				>
					{msg.userName}
				</span>
				<span className='msg-time'>{time}</span>
			</div>

			{/* Reply quote */}
			{msg.replyToId && (msg.replyToUserName || msg.replyToText) && (
				<div className='reply-quote' onPointerUp={e => { e.stopPropagation(); onScrollTo(msg.replyToId!) }}>
					<div className='reply-quote-user'>↩ {msg.replyToUserName || ''}</div>
					{(msg.replyToText || '').slice(0, 120)}
				</div>
			)}

			{/* Text */}
			{isAdmin ? (
				<p className='rainbow-wave'>{msg.text}</p>
			) : (
				<p className='msg-text'>{msg.text}</p>
			)}

			{/* Reactions */}
			{msg.reactions && msg.reactions.length > 0 && (
				<div className='reactions'>
					{msg.reactions.map(r => {
						const isMine = r.users?.includes(currentUser)
						const title = r.users?.join(', ') || ''
						return (
							<span
								key={r.emoji}
								className={`reaction-pill${isMine ? ' mine' : ''}`}
								title={title}
								onPointerDown={e => e.stopPropagation()}
								onPointerUp={e => { e.stopPropagation(); toggleReaction(msg.id, r.emoji) }}
							>
								<span className='reaction-emoji'>{r.emoji}</span>
								<span className='reaction-count'>{r.count}</span>
							</span>
						)
					})}
				</div>
			)}
		</div>
	)
}
