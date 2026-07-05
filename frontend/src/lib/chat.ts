const defaultApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Conversation {
  conversation_id: string
  booking_id: string
  space_name: string
  space_location: string | null
  start_date: string | null
  end_date: string | null
  other_party_name: string
  other_party_role: 'owner' | 'borrower'
  last_message_body: string | null
  last_message_at: string | null
}

export interface ChatMessage {
  id: string
  conversation_id?: string
  sender_user_id: string
  body: string
  created_at: string
}

export type WsStatus = 'connecting' | 'open' | 'closed'

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function fetchConversations(token: string, apiUrl = defaultApiUrl()): Promise<Conversation[]> {
  const response = await fetch(`${apiUrl}/api/chat/conversations`, {
    headers: authHeaders(token),
  })
  if (!response.ok) {
    throw new Error('Failed to load conversations')
  }
  return response.json()
}

export async function fetchMessages(
  conversationId: string,
  token: string,
  apiUrl = defaultApiUrl()
): Promise<ChatMessage[]> {
  const response = await fetch(`${apiUrl}/api/chat/${conversationId}/messages`, {
    headers: authHeaders(token),
  })
  if (!response.ok) {
    throw new Error('Failed to load messages')
  }
  return response.json()
}

export function wsUrlForBooking(bookingId: string, token: string, apiUrl = defaultApiUrl()): string {
  const base = apiUrl.replace(/^http/, 'ws')
  return `${base}/api/chat/ws/${bookingId}?token=${encodeURIComponent(token)}`
}

export function openChatSocket(
  bookingId: string,
  token: string,
  onMessage: (message: ChatMessage) => void,
  onStatusChange?: (status: WsStatus) => void,
  apiUrl = defaultApiUrl()
): WebSocket {
  onStatusChange?.('connecting')
  const ws = new WebSocket(wsUrlForBooking(bookingId, token, apiUrl))

  ws.onopen = () => onStatusChange?.('open')
  ws.onclose = () => onStatusChange?.('closed')
  ws.onerror = () => onStatusChange?.('closed')
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data) as ChatMessage
    onMessage(msg)
  }

  return ws
}

export function formatMessageTime(value: string): string {
  const date = new Date(value)
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (sameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function conversationLabel(conversation: Conversation): string {
  return `${conversation.space_name} · ${conversation.other_party_name}`
}

export function messagesChatHref(bookingId: string): string {
  return `/messages?booking=${encodeURIComponent(bookingId)}`
}
