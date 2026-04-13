import { useState, useRef } from 'react'
import { useChatContext } from '../context/ChatContext'

export default function InputArea() {
  const { sendMessage, startTyping, stopTyping, state } = useChatContext()
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')
    stopTyping()
    await sendMessage(trimmed, state.replyTo?.id ?? null)
    inputRef.current?.focus()
  }

  return (
    <div id="input-area">
      <input
        ref={inputRef}
        id="message-input"
        placeholder="Напишите что-нибудь..."
        autoComplete="off"
        value={text}
        onChange={e => { setText(e.target.value); startTyping() }}
        onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
      />
      <button id="send-btn" onClick={handleSend}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  )
}
