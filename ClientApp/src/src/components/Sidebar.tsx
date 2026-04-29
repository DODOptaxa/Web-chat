import { useState, useEffect, useRef } from 'react'
import type { Room } from '../types'
import { useChatContext } from '../context/ChatContext'

function nameToColor(name: string) {
	let hash = 0
	for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
	return `hsl(${((hash % 360) + 360) % 360}, 55%, 58%)`
}

interface Props {
	rooms: Room[]
	currentRoomId: string
	isOpen: boolean
	onRoomClick: (id: string, name: string) => void
	onCreateRoom: () => void
	onDeleteRoom: (id: string, name: string) => void
	onClose: () => void
}

export default function Sidebar({
	rooms,
	currentRoomId,
	isOpen,
	onRoomClick,
	onCreateRoom,
	onDeleteRoom,
	onClose,
}: Props) {
	const { state, logout } = useChatContext()
	const user = state.user
	const [badgePop, setBadgePop] = useState(false)
	const prevOnlineCount = useRef(state.onlineCount)

	useEffect(() => {
		if (prevOnlineCount.current !== state.onlineCount) {
			prevOnlineCount.current = state.onlineCount
			setBadgePop(true)
			const t = setTimeout(() => setBadgePop(false), 600)
			return () => clearTimeout(t)
		}
	}, [state.onlineCount])

	return (
		<aside id='sidebar' className={isOpen ? 'open' : ''}>
			<div className='sidebar-top'>
				<div className='sidebar-logo'>
					<svg
						width='16'
						height='16'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='1.8'
						strokeLinecap='round'
						strokeLinejoin='round'
					>
						<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
					</svg>
					<em>Чат</em>
				</div>
				<div id='online-badge-chat' className={badgePop ? 'pop' : ''}>
					<span className='badge-pulse' />
					<span id='online-count-chat'>{state.onlineCount}</span>
					<span className='badge-label-chat'>онлайн</span>
				</div>
			</div>

			<div className='sidebar-section-title'>Комнаты</div>
			<ul id='rooms-list'>
				{rooms.map((room, i) => (
					<li
						key={room.id}
						className={`room-item${room.id === currentRoomId ? ' active' : ''}`}
						style={{ animationDelay: `${i * 0.055}s` }}
						onClick={() => {
							onRoomClick(room.id, room.name)
							onClose()
						}}
					>
						<span className='room-icon'>{room.icon}</span>
						<span className='room-name'>{room.name}</span>
						{room.memberCount ? (
							<span className='room-count'>{room.memberCount}</span>
						) : null}

						{i > 0 && (
							<button
								className='room-delete-btn'
								title={`Удалить «${room.name}»`}
								onClick={e => {
									e.stopPropagation()
									onDeleteRoom(room.id, room.name)
								}}
							>
								<svg
									width='10'
									height='10'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2.5'
									strokeLinecap='round'
								>
									<line x1='18' y1='6' x2='6' y2='18' />
									<line x1='6' y1='6' x2='18' y2='18' />
								</svg>
							</button>
						)}
					</li>
				))}
			</ul>

			<div className='sidebar-bottom'>
				<button id='create-room-btn' onClick={onCreateRoom}>
					<svg
						width='13'
						height='13'
						viewBox='0 0 24 24'
						fill='none'
						stroke='currentColor'
						strokeWidth='2.5'
						strokeLinecap='round'
						strokeLinejoin='round'
					>
						<line x1='12' y1='5' x2='12' y2='19' />
						<line x1='5' y1='12' x2='19' y2='12' />
					</svg>
					Новая комната
				</button>
				{user && (
					<div className='sidebar-user'>
						<span
							className='user-avatar'
							style={{ background: nameToColor(user.userName) }}
						>
							{user.userName[0].toUpperCase()}
						</span>
						<span className='user-name'>{user.userName}</span>
						<button className='logout-btn' title='Выйти' onClick={logout}>
							<svg
								width='13'
								height='13'
								viewBox='0 0 24 24'
								fill='none'
								stroke='currentColor'
								strokeWidth='2.2'
								strokeLinecap='round'
								strokeLinejoin='round'
							>
								<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
								<polyline points='16 17 21 12 16 7' />
								<line x1='21' y1='12' x2='9' y2='12' />
							</svg>
						</button>
					</div>
				)}
			</div>
		</aside>
	)
}
