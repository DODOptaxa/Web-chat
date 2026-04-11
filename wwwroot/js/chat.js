'use strict'

import { login, register, getToken, getUser, isLoggedIn, logout } from './auth.js'

// ============================================================
// 1. State
// ============================================================
let currentUser = ''
let currentRoom = 'general'
let typingTimer = null
const TYPING_DELAY = 1000

// ============================================================
// 2. Theme
// ============================================================
const html = document.documentElement
const themeIcon = document.getElementById('theme-icon')

// THEME FIRST TIME SETS IN HTML HEAD
const savedTheme = html.getAttribute("data-theme");
themeIcon.textContent = savedTheme === 'dark' ? '☀' : '☾'

document.getElementById('theme-toggle').addEventListener('click', () => {
	const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
	html.setAttribute('data-theme', next)
	themeIcon.textContent = next === 'dark' ? '☀' : '☾'
	localStorage.setItem('chat-theme', next)
})

// ============================================================
// 3. Helpers
// ============================================================
function escapeHtml(t) {
	return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function nameToColor(name) {
	let hash = 0
	for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
	return `hsl(${((hash % 360) + 360) % 360}, 55%, 58%)`
}

// ============================================================
// 4. UI utilities
// ============================================================
const ui = {
		showChatScreen() {
			document.getElementById('login-screen').classList.add('hidden')
			document.getElementById('chat-screen').classList.remove('hidden')
		},

		showLoginScreen() {
			document.getElementById('chat-screen').classList.add('hidden')
			document.getElementById('login-screen').classList.remove('hidden')
		},

	setStatus(connected) {
		const dot = document.getElementById('status-indicator')
		const wrap = dot.closest('.header-status-wrap')
		if (connected) {
			dot.classList.add('online')
			wrap?.classList.add('connected')
		} else {
			dot.classList.remove('online')
			wrap?.classList.remove('connected')
		}
	},

	setOnlineCount(count) {
		const loginEl = document.getElementById('online-count')
		const chatEl = document.getElementById('online-count-chat')
		if (loginEl)
			loginEl.textContent =
				count != null ? `${count} человек` : 'Подключение...'
		if (chatEl) chatEl.textContent = count != null ? String(count) : '-'
	},

	setRoomName(name) {
		const el = document.getElementById('current-room-name')
		if (el) el.textContent = name
	},

	setSidebarUser(name) {
		const el = document.getElementById('sidebar-user-info')
		if (!el) return
		const color = nameToColor(name)
		el.innerHTML = `
      <span class="user-avatar" style="background:${color}">${escapeHtml(name[0].toUpperCase())}</span>
      <span class="user-name">${escapeHtml(name)}</span>
      <button class="logout-btn" id="logout-btn" title="Выйти">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    `
		document.getElementById('logout-btn').addEventListener('click', doLogout)
	},

	addMessage(msg, isHistory = false) {
		const list = document.getElementById('messages')
		const div = document.createElement('div')
		div.className = 'message' + (msg.userName === currentUser ? ' own' : '')
		div.innerHTML = `
      <span class="msg-user">${escapeHtml(msg.userName)}</span>
      <span class="msg-text">${escapeHtml(msg.text)}</span>
      <span class="msg-time">${new Date(msg.sentAt).toLocaleTimeString()}</span>
    `
		list.appendChild(div)
		if (!isHistory) list.scrollTop = list.scrollHeight
	},

	addSystemMessage(text) {
		const list = document.getElementById('messages')
		const div = document.createElement('div')
		div.className = 'message system'
		div.textContent = text
		list.appendChild(div)
		list.scrollTop = list.scrollHeight
	},

	showTyping(userName) {
		if (document.querySelector(`[data-typing="${userName}"]`)) return
		const list = document.getElementById('messages')
		const el = document.createElement('div')
		el.className = 'message typing-indicator'
		el.dataset.typing = userName
		el.innerHTML = `<span class="msg-user">${escapeHtml(userName)}</span> печатает<span class="dots"><span>.</span><span>.</span><span>.</span></span>`
		list.appendChild(el)
		list.scrollTop = list.scrollHeight
	},

	hideTyping(userName) {
		document.querySelector(`[data-typing="${userName}"]`)?.remove()
	},
}

// ============================================================
// 5. Rooms — render & switch
// ============================================================

function renderRooms(rooms) {
	const list = document.getElementById('rooms-list')
	list.innerHTML = ''
	rooms.forEach((room, index) => {
		const li = document.createElement('li')
		li.className = 'room-item' + (room.id === currentRoom ? ' active' : '')
		li.dataset.roomId = room.id
		li.style.animationDelay = index * 0.055 + 's'
		li.innerHTML = `
      <span class="room-icon">${room.icon}</span>
      <span class="room-name">${escapeHtml(room.name)}</span>
      <span class="room-count">${room.memberCount > 0 ? room.memberCount : ''}</span>
    `
		li.addEventListener('click', e => {
			addRipple(li, e)
			switchRoom(room.id, room.name)
		})
		list.appendChild(li)
	})
}

function addRipple(el, e) {
	const rect = el.getBoundingClientRect()
	const x = e.clientX - rect.left
	const y = e.clientY - rect.top
	const ripple = document.createElement('span')
	ripple.className = 'ripple-el'
	ripple.style.left = x + 'px'
	ripple.style.top = y + 'px'
	el.appendChild(ripple)
	ripple.addEventListener('animationend', () => ripple.remove())
}

async function loadRooms() {
	try {
		if (connection.state === 'Connected') {
			const rooms = await connection.invoke('GetRooms')
			renderRooms(rooms)
		}
	} catch (_) {}
}

async function switchRoom(roomId, roomName) {
	if (roomId === currentRoom) return

	const msgList = document.getElementById('messages')
	msgList.classList.add('fade-out')
	await new Promise(r => setTimeout(r, 130))
	msgList.classList.remove('fade-out')
	msgList.innerHTML = ''

	try {
		await connection.invoke('LeaveRoom', currentRoom)
	} catch (_) {}

	currentRoom = roomId

	document.querySelectorAll('.room-item').forEach(el => {
		el.classList.toggle('active', el.dataset.roomId === roomId)
		if (el.dataset.roomId === roomId)
			el.querySelector('.unread-badge')?.remove()
	})

	ui.setRoomName(roomName || roomId)

	try {
		await connection.invoke('JoinRoom', currentRoom)
	} catch (_) {}

	// close sidebar on mobile after switching room
	closeSidebar()
}

// ============================================================
// 6. SignalR — LOBBY
// ============================================================
const lobbyConnection = new signalR.HubConnectionBuilder()
	.withUrl('/hub/lobby')
	.withAutomaticReconnect()
	.build()

lobbyConnection.on('UsersOnline', count => ui.setOnlineCount(count))
lobbyConnection.start().catch(() => {})

// ============================================================
// 7. SignalR — CHAT
// ============================================================
const connection = new signalR.HubConnectionBuilder()
	.withUrl('/hub/chat', { accessTokenFactory: () => getToken() })
	.withAutomaticReconnect()
	.build()

connection.on('ReceiveMessage', (msg, roomId) => {
	const msgRoom = roomId || currentRoom
	if (msgRoom === currentRoom || !roomId) {
		ui.addMessage(msg)
	} else {
		const item = document.querySelector(`[data-room-id="${msgRoom}"]`)
		if (item) {
			const badge = item.querySelector('.unread-badge')
			if (badge) {
				badge.textContent = +badge.textContent + 1
			} else {
				const b = document.createElement('span')
				b.className = 'unread-badge'
				b.textContent = '1'
				item.appendChild(b)
			}
		}
	}
})

connection.on('LoadHistory', messages => {
	messages.forEach(msg => ui.addMessage(msg, true))
	const list = document.getElementById('messages')
	list.scrollTop = list.scrollHeight
})

connection.on('SystemMessage', text => ui.addSystemMessage(text))
connection.on('UserTyping', name => ui.showTyping(name))
connection.on('UserStoppedTyping', name => ui.hideTyping(name))
connection.on('RoomCreated', () => loadRooms())

connection.onreconnecting(() => ui.setStatus(false))
connection.onreconnected(() => {
	ui.setStatus(true)
	loadRooms()
})

// ============================================================
// 8. Event Listeners
// ============================================================

// ── Shared helpers ──
function showError(msg) {
	const el = document.getElementById('auth-error')
	const text = document.getElementById('auth-error-text')
	if (!msg) {
		el.classList.add('hidden')
		return
	}
	text.textContent = msg
	el.classList.remove('hidden')
}

async function enterChat(data) {
	currentUser = data.userName
	document.getElementById('current-user').textContent = currentUser
	ui.setSidebarUser(currentUser)
	ui.showChatScreen()
	await connection.start()
	await connection.invoke('Register')
	await connection.invoke('JoinRoom', currentRoom)
	ui.setStatus(true)
	await loadRooms()
}

// ── Auth tabs ──
document.querySelectorAll('.auth-tab').forEach(tab => {
	tab.addEventListener('click', () => {
		const target = tab.dataset.tab
		document
			.querySelectorAll('.auth-tab')
			.forEach(t => t.classList.remove('active'))
		tab.classList.add('active')
		document
			.getElementById('tab-login')
			.classList.toggle('hidden', target !== 'login')
		document
			.getElementById('tab-register')
			.classList.toggle('hidden', target !== 'register')
		showError('')
	})
})

// ── Password eye toggles ──
function setupEye(btnId, inputId) {
	const btn = document.getElementById(btnId)
	const input = document.getElementById(inputId)
	if (!btn || !input) return
	btn.addEventListener('click', () => {
		const isPassword = input.type === 'password'
		input.type = isPassword ? 'text' : 'password'
		btn.querySelector('.eye-open').style.display = isPassword ? 'none' : ''
		btn.querySelector('.eye-closed').style.display = isPassword ? '' : 'none'
	})
}
setupEye('toggle-password-login', 'password-input')
setupEye('toggle-password-reg', 'password-input-reg')

// ── Auto-login if token exists ── <------------------------------
window.addEventListener('load', async () => {
	if (isLoggedIn()) {
		const user = getUser()
		if (user) await enterChat(user)
	}
	else {
		ui.showLoginScreen()
	}
})

document.getElementById('login-btn').addEventListener('click', async () => {
	const email = document.getElementById('email-input').value.trim()
	const password = document.getElementById('password-input').value.trim()

	if (!email || !password) return
	showError('')

	try {
		const data = await login(email, password)
		await enterChat(data)
	} catch (e) {
		showError(e.message)
	}
})

document.getElementById('register-btn').addEventListener('click', async () => {
	const userName = document.getElementById('username-input').value.trim()
	const email = document.getElementById('email-input-reg').value.trim()
	const password = document.getElementById('password-input-reg').value.trim()

	if (!userName || !email || !password) return
	showError('')

	try {
		const data = await register(userName, email, password)
		await enterChat(data)
	} catch (e) {
		showError(e.message)
	}
})

document.getElementById('username-input').addEventListener('keydown', e => {
	if (e.key === 'Enter') document.getElementById('register-btn').click()
})

document.getElementById('email-input').addEventListener('keydown', e => {
	if (e.key === 'Enter') document.getElementById('login-btn').click()
})

document.getElementById('password-input').addEventListener('keydown', e => {
	if (e.key === 'Enter') document.getElementById('login-btn').click()
})

document.getElementById('message-input').addEventListener('input', () => {
	try {
		connection.invoke('StartTyping', currentRoom)
	} catch (_) {}
	clearTimeout(typingTimer)
	typingTimer = setTimeout(() => {
		try {
			connection.invoke('StopTyping', currentRoom)
		} catch (_) {}
	}, TYPING_DELAY)
})

document.getElementById('send-btn').addEventListener('click', sendMessage)
document.getElementById('message-input').addEventListener('keydown', e => {
	if (e.key === 'Enter') sendMessage()
})

async function sendMessage() {
	const input = document.getElementById('message-input')
	const text = input.value.trim()
	if (!text) return

	try {
		await connection.invoke('SendMessage', currentRoom, text)
	} catch (_) {
		ui.addMessage({
			userName: currentUser,
			text,
			sentAt: new Date().toISOString(),
		})
	}

	input.value = ''
	input.focus()
}

// ── Sidebar mobile toggle ──
const sidebar = document.getElementById('sidebar')
const backdrop = document.getElementById('sidebar-backdrop')
const sidebarBtn = document.getElementById('sidebar-toggle')

function openSidebar() {
	sidebar.classList.add('open')
	backdrop.classList.add('visible')
}
function closeSidebar() {
	sidebar.classList.remove('open')
	backdrop.classList.remove('visible')
}

sidebarBtn?.addEventListener('click', () => {
	sidebar.classList.contains('open') ? closeSidebar() : openSidebar()
})
backdrop?.addEventListener('click', closeSidebar)

// close sidebar on room switch (mobile UX)
const _origSwitchRoom = switchRoom

// ── Logout ──
async function doLogout() {
	try {
		await connection.stop()
	} catch (_) { }

	ui.showLoginScreen()
	logout()
}

// ── Modal ──
const modal = document.getElementById('room-modal')
const modalOverlay = modal.querySelector('.modal-overlay')

document.getElementById('create-room-btn').addEventListener('click', () => {
	document.getElementById('room-name-input').value = ''
	document.getElementById('room-icon-input').value = ''
	modal.classList.remove('hidden')
	setTimeout(() => document.getElementById('room-name-input').focus(), 50)
})

document.getElementById('modal-cancel').addEventListener('click', closeModal)
modalOverlay.addEventListener('click', closeModal)
document.addEventListener('keydown', e => {
	if (e.key === 'Escape') closeModal()
})

function closeModal() {
	modal.classList.add('hidden')
}

document.getElementById('modal-confirm').addEventListener('click', async () => {
	const name = document.getElementById('room-name-input').value.trim()
	const icon = document.getElementById('room-icon-input').value.trim() || '💬'
	if (!name) {
		document.getElementById('room-name-input').focus()
		return
	}

	try {
		await connection.invoke('CreateRoom', name, icon)
	} catch (_) {}

	closeModal()
	await loadRooms()
})

document.getElementById('room-name-input').addEventListener('keydown', e => {
	if (e.key === 'Enter') document.getElementById('modal-confirm').click()
})
