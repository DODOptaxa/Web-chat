import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('chat-theme') as 'light' | 'dark') || 'light'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('chat-theme', theme)
  }, [theme])

  return (
    <button
      id="theme-toggle"
      title="Сменить тему"
      onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
    >
      <span id="theme-icon">{theme === 'dark' ? '☀' : '☾'}</span>
    </button>
  )
}
