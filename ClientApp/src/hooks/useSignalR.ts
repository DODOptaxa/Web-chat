import { useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import { getToken } from '../api/auth'

export function useSignalR(url: string, requireAuth = false) {
  const connRef = useRef<signalR.HubConnection | null>(null)

  if (!connRef.current) {
    const builder = new signalR.HubConnectionBuilder().withUrl(
      url,
      requireAuth ? { accessTokenFactory: () => getToken() ?? '' } : {}
    ).withAutomaticReconnect()

    connRef.current = builder.build()
  }

  useEffect(() => {
    return () => {
      connRef.current?.stop()
    }
  }, [])

  return connRef.current
}
