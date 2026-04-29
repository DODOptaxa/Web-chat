import { useEffect, useRef, useState } from 'react'
import type { MessageDto } from '../types'
import Message from './Message'

interface Props {
	messages: MessageDto[]
	currentUser: string
	roomId: string
	onReply: (msg: MessageDto) => void
	onReact: (msgId: number) => void
}

export default function MessageList({
	messages,
	currentUser,
	roomId,
	onReply,
	onReact,
}: Props) {
	const listRef = useRef<HTMLDivElement>(null)
	const prevRoomIdRef = useRef<string>(roomId)
	const needsScrollRef = useRef<boolean>(true)
	const [activeMsgId, setActiveMsgId] = useState<number | null>(null)

	function isNearBottom() {
		const el = listRef.current
		if (!el) return true
		return el.scrollHeight - el.scrollTop - el.clientHeight < 100
	}

	function scrollToBottom() {
		const el = listRef.current
		if (!el) return
		el.scrollTop = el.scrollHeight
	}

	function scrollToMsg(msgId: number) {
		const el = listRef.current?.querySelector(
			`[data-msg-id="${msgId}"]`,
		) as HTMLElement | null
		if (!el) return
		el.scrollIntoView({ behavior: 'smooth', block: 'center' })
		el.classList.add('highlight')
		setTimeout(() => el.classList.remove('highlight'), 1200)
	}

	useEffect(() => {
		if (prevRoomIdRef.current !== roomId) {
			prevRoomIdRef.current = roomId
			needsScrollRef.current = true
			setActiveMsgId(null)
			const el = listRef.current
			if (el) el.scrollTop = 0
		}
	}, [roomId])

	useEffect(() => {
		if (messages.length === 0) return
		if (needsScrollRef.current) {
			needsScrollRef.current = false
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					scrollToBottom()
				})
			})
		} else if (isNearBottom()) {
			scrollToBottom()
		}
	}, [messages.length])

	return (
		<div id='messages' ref={listRef}>
			{messages.map(msg => (
				<Message
					key={msg.id}
					msg={msg}
					currentUser={currentUser}
					activeMsgId={activeMsgId}
					onSetActive={setActiveMsgId}
					onReply={onReply}
					onReact={onReact}
					onScrollTo={scrollToMsg}
				/>
			))}
		</div>
	)
}
