import { useState, useEffect, useRef } from 'react'
import { useChatContext } from '../context/ChatContext'
import { EMOJI_DATA } from '../data/emojiData'

interface Props {
  onClose: () => void
}

export default function RoomModal({ onClose }: Props) {
  const { createRoom } = useChatContext()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleConfirm() {
    const categories = Object.keys(EMOJI_DATA);

const randomCategory = categories[Math.floor(Math.random() * categories.length)];

const emojis = EMOJI_DATA[randomCategory];
const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    if (!name.trim()) { inputRef.current?.focus(); return }
    await createRoom(name.trim(), randomEmoji || '💬')
    onClose()
  }

  return (
		<div id='room-modal' className='modal'>
			<div className='modal-overlay' onClick={onClose} />
			<div className='modal-card'>
				<div className='modal-shimmer' />
				<h3 className='modal-title'>Создать комнату</h3>
				<p className='modal-sub'>Введите название и выберите эмодзи</p>
				<div className='modal-fields'>
					<div className='field-group'>
						<label className='field-label'>Название</label>
						<div className='field-wrap'>
							<input
								ref={inputRef}
								className='field-input'
								placeholder='Например: дизайн'
								maxLength={30}
								value={name}
								onChange={e => setName(e.target.value)}
								onKeyDown={e => e.key === 'Enter' && handleConfirm()}
							/>
						</div>
					</div>
				</div>
				<div className='modal-actions'>
					<button className='btn-modal-cancel' onClick={onClose}>
						Отмена
					</button>
					<button className='btn-modal-confirm' onClick={handleConfirm}>
						<span>Создать</span>
						<span className='btn-arrow'>→</span>
					</button>
				</div>
			</div>
		</div>
	)
}
