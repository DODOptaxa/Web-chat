import { useState, useEffect } from 'react'
import { EMOJI_DATA } from '../data/emojiData'
import { useChatContext } from '../context/ChatContext'

interface Props {
  msgId: number | null
  onClose: () => void
}

export default function EmojiModal({ msgId, onClose }: Props) {
  const { toggleReaction, state } = useChatContext()
  const categories = Object.keys(EMOJI_DATA)
  const [activeCategory, setActiveCategory] = useState(categories[0])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleEmoji(emoji: string) {
    if (msgId == null) return
    onClose()

    // Find the current user's existing reaction on this message
    const msg = state.messages.find(m => m.id === msgId)
    const existing = msg?.reactions.find(r => r.userName === state.user?.userName)

    if (existing && existing.emoji !== emoji) {
      // Different emoji selected — remove old reaction first, then add new
      await toggleReaction(msgId, existing.emoji)
      await toggleReaction(msgId, emoji)
    } else {
      // Same emoji (toggle off) or no prior reaction (add)
      await toggleReaction(msgId, emoji)
    }
  }

  if (msgId == null) return null

  return (
    <div className="emoji-modal">
      <div className="emoji-modal-overlay" onClick={onClose} />
      <div className="emoji-modal-card">
        <div className="emoji-modal-header">
          <span className="emoji-modal-title">Выберите реакцию</span>
          <button className="emoji-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="emoji-modal-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`emoji-tab-btn${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="emoji-modal-grid">
          {EMOJI_DATA[activeCategory].map(emoji => (
            <button key={emoji} className="emoji-grid-btn" onClick={() => handleEmoji(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
