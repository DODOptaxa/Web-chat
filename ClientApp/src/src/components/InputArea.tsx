import { useRef, useImperativeHandle, forwardRef } from 'react'
import { useChatContext } from '../context/ChatContext'
import { useState } from 'react'
import { scrollToBottom } from '../utils/scroll'

export interface InputAreaHandle {
	insertEmoji: (emoji: string) => void
}

interface Props {
	onOpenEmojiPicker: () => void
}

const InputArea = forwardRef<InputAreaHandle, Props>(function InputArea(
	{ onOpenEmojiPicker },
	ref,
) {
	const { sendMessage, startTyping, stopTyping, state } = useChatContext()
	const [text, setText] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

	function insertEmoji(emoji: string) {
		const input = inputRef.current
		const start = input?.selectionStart ?? text.length
		const end = input?.selectionEnd ?? text.length
		const newText = text.slice(0, start) + emoji + text.slice(end)
		setText(newText)
    const pos = start + emoji.length
    input?.setSelectionRange(pos, pos)
	}

	useImperativeHandle(ref, () => ({ insertEmoji }))

	async function handleSend() {
		const trimmed = text.trim()
		if (!trimmed) return
		setText('')
		stopTyping()
		await sendMessage(trimmed, state.replyTo?.id ?? null)
    scrollToBottom()
		inputRef.current?.focus()
	}

	return (
		<div id='input-area'>
			<button
				id='emoji-picker-btn'
				title='Добавить эмодзи'
				onClick={onOpenEmojiPicker}
				style={{
					fontSize: 18,
					background: 'none',
					border: 'none',
					cursor: 'pointer',
					padding: '0 6px',
					opacity: 0.6,
					lineHeight: 1,
				}}
			>
				😊
			</button>

			<input
				ref={inputRef}
				id='message-input'
				placeholder='Напишите что-нибудь...'
				autoComplete='off'
				value={text}
				onChange={e => {
					setText(e.target.value)
					startTyping()
				}}
				onKeyDown={e => {
					if (e.key === 'Enter') handleSend()
				}}
			/>
			<button id='send-btn' onClick={handleSend}>
				<svg
					width='15'
					height='15'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='2.5'
					strokeLinecap='round'
					strokeLinejoin='round'
				>
					<line x1='22' y1='2' x2='11' y2='13' />
					<polygon points='22 2 15 22 11 13 2 9 22 2' />
				</svg>
			</button>
		</div>
	)
})

export default InputArea
