export function scrollToBottom() {
	const el = document.getElementById('messages')
	if (!el) return
	requestAnimationFrame(() => {
		el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
	})
}
