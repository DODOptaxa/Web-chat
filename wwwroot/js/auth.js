'use strict'

const TOKEN_KEY = 'chat-token'
const USER_NAME = 'chat-user'

// get token from localStorage
export function getToken() {
	return localStorage.getItem(TOKEN_KEY)
}

// Get saved user
export function getUser() {
	return JSON.parse(localStorage.getItem(USER_NAME) || 'null')
}

export function isLoggedIn() {
	return !!getToken()
}

// Register
export async function register(userName, email, password) {
	const res = await fetch('/api/auth/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ userName, email, password }),
	})
	const data = await res.json()
	if (!res.ok) throw new Error(data.error) 
	_save(data)
	return data
}

// Login
export async function login(email, password) {
	const res = await fetch('/api/auth/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	})
	const data = await res.json()
	if (!res.ok) throw new Error(data.error)
	_save(data)
	return data
}

// Out
export function logout() {
	localStorage.removeItem(TOKEN_KEY)
	localStorage.removeItem(USER_NAME)
	console.log("REMOVEE")
	location.reload()
}

// Сохранить токен и имя
function _save(data) {
	localStorage.setItem(TOKEN_KEY, data.token)
	localStorage.setItem(USER_NAME, JSON.stringify({ userName: data.userName }))
}
