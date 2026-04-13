import { useEffect, useState } from 'react'
import { ChatProvider, useChatContext } from '../context/ChatContext'
import { isLoggedIn, getStoredUser } from '../api/auth'
import LoginScreen from './LoginScreen'
import ChatScreen from './ChatScreen'

function AppInner() {
  const { state, enterChat } = useChatContext()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (isLoggedIn()) {
      const user = getStoredUser()
      if (user) {
        enterChat(user).finally(() => setReady(true))
      } else {
        setReady(true)
      }
    } else {
      setReady(true)
    }
  }, [])

  if (!ready) return null

  return state.user ? <ChatScreen /> : <LoginScreen />
}

export default function App() {
  return (
    <ChatProvider>
      <AppInner />
    </ChatProvider>
  )
}
