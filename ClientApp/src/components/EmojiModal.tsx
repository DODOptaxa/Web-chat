import { useState, useEffect } from 'react'
import { EMOJI_DATA } from '../data/emojiData'
import { useChatContext } from '../context/ChatContext'

interface Props {

	msgId: number | null
	onClose: () => void
	onInsert?: (emoji: string) => void 
}

export default function EmojiModal({ msgId, onClose, onInsert }: Props) {
	const { toggleReaction } = useChatContext()
	const categories = Object.keys(EMOJI_DATA)
	const [activeCategory, setActiveCategory] = useState(categories[0])

	const isInputMode = msgId === null // режим вставки в поле ввода

	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose()
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [onClose])

	async function handleEmoji(emoji: string) {
		if (isInputMode) {

			onInsert?.(emoji)
		} else {

			onClose()
			await toggleReaction(msgId!, emoji)
		}
	}

	return (
		<div className='emoji-modal'>
			<div className='emoji-modal-overlay' onClick={onClose} />
			<div className='emoji-modal-card'>
				<div className='emoji-modal-header'>
					<span className='emoji-modal-title'>
						{isInputMode ? 'Вставить эмодзи' : 'Выберите реакцию'}
					</span>
					<button className='emoji-modal-close' onClick={onClose}>
						✕
					</button>
				</div>
				<div className='emoji-modal-tabs'>
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
				<div className='emoji-modal-grid'>
					{EMOJI_DATA[activeCategory].map(emoji => (
						<button
							key={emoji}
							className='emoji-grid-btn'
							onClick={() => handleEmoji(emoji)}
						>
							{emoji}
						</button>
					))}
				</div>
			</div>
		</div>
	)
}
