import { useEffect, useRef } from 'react'
import type { MessageDto } from '../types'
import Message from './Message'
import { scrollToBottom } from '../utils/scroll'

interface Props {
	messages: MessageDto[]
	currentUser: string
	roomId: string
	onReply: (msg: MessageDto) => void
	onReact: (msgId: number) => void
}

export default function MessageList({ messages, currentUser, roomId, onReply, onReact }: Props) {
  const listRef   = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)
  const prevRoomId = useRef<string>('')

  function isNearBottom() {
		const el = listRef.current
		if (!el) return true
		const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
		return distanceFromBottom < 100 
	}

  function scrollToMsg(msgId: number) {
    const el = listRef.current?.querySelector(`[data-msg-id="${msgId}"]`) as HTMLElement | null
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 1200)
  }

  useEffect(() => {
    console.log('roomId changed:', roomId)
		isFirstLoad.current = true
	}, [roomId])

	useEffect(() => {
    console.log('messages.length changed:', messages.length, 'isFirstLoad:', isFirstLoad.current)
		if (messages.length === 0) return

		const isRoomChange = prevRoomId.current !== roomId
		prevRoomId.current = roomId

		if (isRoomChange) {
			requestAnimationFrame(() => {
				const el = listRef.current
				if (el) el.scrollTop = el.scrollHeight
			})
			return
		}

		if (isNearBottom()) scrollToBottom()
	}, [messages.length])

  return (
    <div id="messages" ref={listRef}>
      {messages.map(msg => (
        <Message
          key={msg.id}
          msg={msg}
          currentUser={currentUser}
          onReply={onReply}
          onReact={onReact}
          onScrollTo={scrollToMsg}
        />
      ))}
    </div>
  )
}
