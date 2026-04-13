import { useEffect, useRef } from 'react'
import type { MessageDto } from '../types'
import Message from './Message'

interface Props {
  messages: MessageDto[]
  currentUser: string
  onReply: (msg: MessageDto) => void
  onReact: (msgId: number) => void
}

export default function MessageList({ messages, currentUser, onReply, onReact }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function scrollToMsg(msgId: number) {
    const el = listRef.current?.querySelector(`[data-msg-id="${msgId}"]`) as HTMLElement | null
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 1200)
  }

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
      <div ref={bottomRef} />
    </div>
  )
}
