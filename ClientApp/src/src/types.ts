export interface ReactionDto {
  emoji: string
  count: number
  users: string[]
}

export interface MessageDto {
  id: number
  userName: string
  text: string
  sentAt: string
  roomId: string | null
  replyToId: number | null
  replyToUserName: string | null
  replyToText: string | null
  reactions: ReactionDto[]
}

export interface Room {
  id: string
  name: string
  icon: string
  memberCount?: number
}

export interface AuthUser {
	userName: string
	token: string
	role: string
}
