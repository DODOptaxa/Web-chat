import React, {
	createContext,
	useContext,
	useReducer,
	useCallback,
	useRef,
	useEffect,
	type ReactNode,
} from 'react'
import * as signalR from '@microsoft/signalr'
import { getToken, clearAuth } from '../api/auth'
import type { MessageDto, Room, AuthUser, ReactionDto } from '../types'

// ── State ────────────────────────────────────────────────────────────────────

interface ChatState {
	user: AuthUser | null
	messages: MessageDto[]
	rooms: Room[]
	currentRoomId: string
	onlineCount: number
	connected: boolean
	replyTo: { id: number; userName: string; text: string } | null
	typingUsers: string[]
}

const initial: ChatState = {
	user: null,
	messages: [],
	rooms: [],
	currentRoomId: 'general',
	onlineCount: 0,
	connected: false,
	replyTo: null,
	typingUsers: [],
}

// ── Actions ──────────────────────────────────────────────────────────────────

type Action =
	| { type: 'SET_USER'; payload: AuthUser | null }
	| { type: 'SET_MESSAGES'; payload: MessageDto[] }
	| { type: 'ADD_MESSAGE'; payload: MessageDto }
	| { type: 'SET_ROOMS'; payload: Room[] }
	| { type: 'SET_ROOM'; payload: string }
	| { type: 'SET_ONLINE'; payload: number }
	| { type: 'SET_CONNECTED'; payload: boolean }
	| { type: 'SET_REPLY_TO'; payload: ChatState['replyTo'] }
	| {
		type: 'UPDATE_REACTIONS'
		payload: { msgId: number; reactions: ReactionDto[] }
	}
	| { type: 'ADD_SYSTEM_MSG'; payload: string }
	| { type: 'ADD_TYPING'; payload: string }
	| { type: 'REMOVE_TYPING'; payload: string }
	| { type: 'REMOVE_ROOM'; payload: string }

function reducer(state: ChatState, action: Action): ChatState {
	switch (action.type) {
		case 'SET_USER':
			return { ...state, user: action.payload }
		case 'SET_MESSAGES':
			return { ...state, messages: action.payload }
		case 'ADD_MESSAGE':
			return { ...state, messages: [...state.messages, action.payload] }
		case 'SET_ROOMS':
			return { ...state, rooms: action.payload }
		case 'SET_ROOM':
			return { ...state, currentRoomId: action.payload, messages: [] }
		case 'SET_ONLINE':
			return { ...state, onlineCount: action.payload }
		case 'SET_CONNECTED':
			return { ...state, connected: action.payload }
		case 'SET_REPLY_TO':
			return { ...state, replyTo: action.payload }
		case 'UPDATE_REACTIONS':
			return {
				...state,
				messages: state.messages.map(m =>
					m.id === action.payload.msgId
						? { ...m, reactions: action.payload.reactions }
						: m,
				),
			}
		case 'ADD_SYSTEM_MSG':
			return {
				...state,
				messages: [
					...state.messages,
					{
						id: Date.now() * -1,
						userName: '__system__',
						text: action.payload,
						sentAt: new Date().toISOString(),
						roomId: state.currentRoomId,
						replyToId: null,
						replyToUserName: null,
						replyToText: null,
						reactions: [],
					},
				],
			}
		case 'ADD_TYPING':
			return state.typingUsers.includes(action.payload)
				? state
				: { ...state, typingUsers: [...state.typingUsers, action.payload] }
		case 'REMOVE_TYPING':
			return {
				...state,
				typingUsers: state.typingUsers.filter(u => u !== action.payload),
			}
		case 'REMOVE_ROOM': {
			const remaining = state.rooms.filter(r => r.id !== action.payload)
			const deletedCurrent = state.currentRoomId === action.payload
			const newRoomId = deletedCurrent
				? (remaining[0]?.id ?? '')
				: state.currentRoomId
			return {
				...state,
				rooms: remaining,
				currentRoomId: newRoomId,
				messages: deletedCurrent ? [] : state.messages,
			}
		}
		default:
			return state
	}
}

// ── Context ───────────────────────────────────────────────────────────────────

interface ChatContextValue {
	state: ChatState
	chatConn: signalR.HubConnection | null
	enterChat: (user: AuthUser) => Promise<void>
	logout: () => void
	switchRoom: (id: string, name: string) => Promise<void>
	sendMessage: (text: string, replyId?: number | null) => Promise<void>
	toggleReaction: (msgId: number, emoji: string) => Promise<void>
	createRoom: (name: string, icon: string) => Promise<void>
	deleteRoom: (roomId: string) => Promise<void>
	setReplyTo: (r: ChatState['replyTo']) => void
	startTyping: () => void
	stopTyping: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function useChatContext() {
	const ctx = useContext(ChatContext)
	if (!ctx) throw new Error('useChatContext must be inside ChatProvider')
	return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(reducer, initial)
	const chatConnRef = useRef<signalR.HubConnection | null>(null)
	const lobbyConnRef = useRef<signalR.HubConnection | null>(null)
	const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const currentRoomRef = useRef('general')
	const roomsRef = useRef<Room[]>(state.rooms)

	// Keep refs in sync so callbacks don't close over stale values
	useEffect(() => {
		currentRoomRef.current = state.currentRoomId
	}, [state.currentRoomId])

	useEffect(() => {
		roomsRef.current = state.rooms
	}, [state.rooms])

	// ── Lobby (online count, no auth) ─────────────────────────────────────────
	useEffect(() => {
		const lobby = new signalR.HubConnectionBuilder()
			.withUrl('/hub/lobby')
			.withAutomaticReconnect()
			.build()
		lobbyConnRef.current = lobby
		lobby.on('UsersOnline', (count: number) =>
			dispatch({ type: 'SET_ONLINE', payload: count }),
		)
		lobby.start().catch(() => { })
		return () => {
			lobby.stop()
		}
	}, [])

	// ── Enter chat ────────────────────────────────────────────────────────────
	const enterChat = useCallback(async (user: AuthUser) => {
		// Stop any existing connection (e.g. StrictMode double-invoke)
		if (chatConnRef.current) {
			await chatConnRef.current.stop()
			chatConnRef.current = null
		}

		const conn = new signalR.HubConnectionBuilder()
			.withUrl('/hub/chat', { accessTokenFactory: () => getToken() ?? '' })
			.withAutomaticReconnect()
			.build()
		chatConnRef.current = conn

		conn.on('ReceiveMessage', (msg: MessageDto, roomId: string) => {
			if (roomId === currentRoomRef.current) {
				dispatch({ type: 'ADD_MESSAGE', payload: msg })
			}
		})
		conn.on('LoadHistory', (msgs: MessageDto[]) => {
			dispatch({ type: 'SET_MESSAGES', payload: msgs })
		})
		conn.on('ReactionUpdated', (msgId: number, reactions: ReactionDto[]) => {
			dispatch({ type: 'UPDATE_REACTIONS', payload: { msgId, reactions } })
		})
		conn.on('SystemMessage', (text: string) => {
			dispatch({ type: 'ADD_SYSTEM_MSG', payload: text })
		})
		conn.on('UserTyping', (name: string) => {
			dispatch({ type: 'ADD_TYPING', payload: name })
		})
		conn.on('UserStoppedTyping', (name: string) => {
			dispatch({ type: 'REMOVE_TYPING', payload: name })
		})
		conn.on('RoomCreated', () => loadRooms(conn))
		conn.on('RoomDeleted', (roomId: string) => {
			dispatch({ type: 'REMOVE_ROOM', payload: roomId })
		})
		conn.onreconnecting(() =>
			dispatch({ type: 'SET_CONNECTED', payload: false }),
		)
		conn.onreconnected(() => {
			dispatch({ type: 'SET_CONNECTED', payload: true })
			loadRooms(conn)
		})

		await conn.start()
		await conn.invoke('Register')
		await conn.invoke('JoinRoom', currentRoomRef.current)
		await loadRooms(conn)
		dispatch({ type: 'SET_CONNECTED', payload: true })
		dispatch({ type: 'SET_USER', payload: user })
	}, [])

	// ── Load rooms ────────────────────────────────────────────────────────────
	async function loadRooms(conn: signalR.HubConnection) {
		try {
			const rooms = await conn.invoke<Room[]>('GetRooms')
			dispatch({ type: 'SET_ROOMS', payload: rooms })
		} catch { }
	}

	// ── Switch room ───────────────────────────────────────────────────────────
	const switchRoom = useCallback(async (id: string, _name: string) => {
		const conn = chatConnRef.current
		if (!conn || id === currentRoomRef.current) return
		try {
			await conn.invoke('LeaveRoom', currentRoomRef.current)
		} catch { }
		dispatch({ type: 'SET_ROOM', payload: id })
		try {
			await conn.invoke('JoinRoom', id)
		} catch { }
	}, [])

	// ── Send message ──────────────────────────────────────────────────────────
	const sendMessage = useCallback(
		async (text: string, replyId?: number | null) => {
			const conn = chatConnRef.current
			if (!conn) return
			await conn.invoke(
				'SendMessage',
				currentRoomRef.current,
				text,
				replyId ?? null,
			)
			dispatch({ type: 'SET_REPLY_TO', payload: null })
		},
		[],
	)

	// ── Toggle reaction ───────────────────────────────────────────────────────
	const toggleReaction = useCallback(async (msgId: number, emoji: string) => {
		const conn = chatConnRef.current
		if (!conn) return
		await conn.invoke('ToggleReaction', msgId, emoji)
	}, [])

	// ── Create room ───────────────────────────────────────────────────────────
	const createRoom = useCallback(async (name: string, icon: string) => {
		const conn = chatConnRef.current
		if (!conn) return
		await conn.invoke('CreateRoom', name, icon)
	}, [])

	// ── Delete room ───────────────────────────────────────────────────────────
	const deleteRoom = useCallback(
		async (roomId: string) => {
			const conn = chatConnRef.current
			if (!conn) return
			// Оптимистично убираем комнату из UI сразу
			dispatch({ type: 'REMOVE_ROOM', payload: roomId })
			// Если удалили текущую — переключаемся на первую оставшуюся
			if (currentRoomRef.current === roomId) {
				const next = roomsRef.current[0]
				if (next) await switchRoom(next.id, next.name)
			}
			await conn.invoke('DeleteRoom', roomId)
		},
		[switchRoom],
	)

	// ── Typing ────────────────────────────────────────────────────────────────
	const startTyping = useCallback(() => {
		const conn = chatConnRef.current
		if (!conn) return
		try {
			conn.invoke('StartTyping', currentRoomRef.current)
		} catch { }
		if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
		typingTimerRef.current = setTimeout(() => {
			try {
				conn.invoke('StopTyping', currentRoomRef.current)
			} catch { }
		}, 1000)
	}, [])

	const stopTyping = useCallback(() => {
		const conn = chatConnRef.current
		if (!conn) return
		if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
		try {
			conn.invoke('StopTyping', currentRoomRef.current)
		} catch { }
	}, [])

	// ── Logout ────────────────────────────────────────────────────────────────
	const logout = useCallback(() => {
		chatConnRef.current?.stop()
		clearAuth()
		dispatch({ type: 'SET_USER', payload: null })
		dispatch({ type: 'SET_CONNECTED', payload: false })
	}, [])

	const setReplyTo = useCallback((r: ChatState['replyTo']) => {
		dispatch({ type: 'SET_REPLY_TO', payload: r })
	}, [])

	return (
		<ChatContext.Provider
			value={{
				state,
				chatConn: chatConnRef.current,
				enterChat,
				logout,
				switchRoom,
				sendMessage,
				toggleReaction,
				createRoom,
				deleteRoom,
				setReplyTo,
				startTyping,
				stopTyping,
			}}
		>
			{children}
		</ChatContext.Provider>
	)
}