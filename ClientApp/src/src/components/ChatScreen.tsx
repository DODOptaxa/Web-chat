import { useState, useRef, useEffect } from 'react'
import { useChatContext } from '../context/ChatContext'
import type { MessageDto } from '../types'
import Sidebar from './Sidebar'
import MessageList from './MessageList'
import ReplyBar from './ReplyBar'
import InputArea, { type InputAreaHandle } from './InputArea'
import EmojiModal from './EmojiModal'
import RoomModal from './RoomModal'
import ThemeToggle from './ThemeToggle'

type EmojiTarget = number | 'input' | null

export default function ChatScreen() {
	const { state, switchRoom, setReplyTo, deleteRoom } = useChatContext()
	const { user, messages, rooms, currentRoomId, connected, typingUsers } = state

	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [showRoomModal, setShowRoomModal] = useState(false)
	const [emojiTarget, setEmojiTarget] = useState<EmojiTarget>(null)

	const inputAreaRef = useRef<InputAreaHandle>(null)
	const [statusPop, setStatusPop] = useState(false)
	const prevOnlineCount = useRef(state.onlineCount)

	useEffect(() => {
		if (prevOnlineCount.current !== state.onlineCount) {
			prevOnlineCount.current = state.onlineCount
			setStatusPop(true)
			const t = setTimeout(() => setStatusPop(false), 600)
			return () => clearTimeout(t)
		}
	}, [state.onlineCount])

	const currentRoom = rooms.find(r => r.id === currentRoomId)

	const allMessages = [
		...messages,
		...typingUsers
			.filter(name => name !== user?.userName)
			.map(
				name =>
					({
						id: -(name.length + Date.now()),
						userName: name,
						text: `${name} печатает...`,
						sentAt: new Date().toISOString(),
						roomId: currentRoomId,
						replyToId: null,
						replyToUserName: null,
						replyToText: null,
						reactions: [],
						_isTyping: true,
					}) as MessageDto & { _isTyping?: boolean },
			),
	]

	async function handleDeleteRoom(roomId: string, roomName: string) {
		if (
			!window.confirm(
				`Удалить комнату «${roomName}»?\nЭто действие нельзя отменить.`,
			)
		)
			return
		await deleteRoom(roomId)
	}

	return (
		<>
			<div className='bg-grid' />
			<div className='bg-glow glow-1' />
			<div className='bg-glow glow-2' />
			<ThemeToggle />

			<div id='app'>
				<div id='chat-screen'>
					{sidebarOpen && (
						<div
							id='sidebar-backdrop'
							className='visible'
							onClick={() => setSidebarOpen(false)}
						/>
					)}

					<Sidebar
						rooms={rooms}
						currentRoomId={currentRoomId}
						isOpen={sidebarOpen}
						onRoomClick={(id, name) => switchRoom(id, name)}
						onCreateRoom={() => setShowRoomModal(true)}
						onClose={() => setSidebarOpen(false)}
						onDeleteRoom={handleDeleteRoom}
					/>

					<div className='chat-main'>
						<header id='chat-header'>
							<div className='header-left'>
								<button
									id='sidebar-toggle'
									aria-label='Меню'
									onClick={() => setSidebarOpen(v => !v)}
								>
									<svg
										width='14'
										height='14'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2.5'
										strokeLinecap='square'
									>
										<line x1='3' y1='6' x2='21' y2='6' />
										<line x1='3' y1='12' x2='21' y2='12' />
										<line x1='3' y1='18' x2='21' y2='18' />
									</svg>
								</button>
								<div className='header-status-wrap'>
									<span
										id='status-indicator'
										className={`status-dot${connected ? ' online' : ''}`}
									/>
								</div>
								<div className='header-room-info'>
									<span id='current-room-name' className='header-room-name'>
										{currentRoom?.name ?? currentRoomId}
									</span>
									<span id='current-user' className='header-username'>
										{user?.userName}
									</span>
								</div>
							</div>
						</header>

						<MessageList
							messages={allMessages}
							currentUser={user?.userName ?? ''}
					roomId={currentRoomId}
							onReply={(msg: MessageDto) =>
								setReplyTo({
									id: msg.id,
									userName: msg.userName,
									text: msg.text,
								})
							}
							onReact={(msgId: number) => setEmojiTarget(msgId)}
						/>

						<ReplyBar />

						<InputArea
							ref={inputAreaRef}
							onOpenEmojiPicker={() => setEmojiTarget('input')}
						/>
					</div>
				</div>
			</div>

			{emojiTarget !== null && (
				<EmojiModal
					msgId={emojiTarget === 'input' ? null : emojiTarget}
					onClose={() => setEmojiTarget(null)}
					onInsert={
						emojiTarget === 'input'
							? emoji => inputAreaRef.current?.insertEmoji(emoji)
							: undefined
					}
				/>
			)}

			{showRoomModal && <RoomModal onClose={() => setShowRoomModal(false)} />}
		</>
	)
}
