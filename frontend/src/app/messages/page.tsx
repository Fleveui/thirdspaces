/**
 * Messages page — chat for approved bookings.
 */

'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { useAuth } from '@/lib/auth'

interface Conversation {
  conversation_id: string
  booking_id: string
  space_name: string
}

interface ChatMessage {
  id: string
  sender_user_id: string
  body: string
  created_at: string
}

function MessagesContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const wsUrl = apiUrl.replace(/^http/, 'ws')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    fetch(`${apiUrl}/api/chat/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: Conversation[]) => {
        setConversations(data)
        const bookingParam = searchParams.get('booking')
        if (bookingParam) {
          const match = data.find((c) => c.booking_id === bookingParam)
          if (match) setSelected(match)
        } else if (data.length > 0) {
          setSelected(data[0])
        }
      })
      .finally(() => setLoading(false))
  }, [apiUrl, searchParams])

  useEffect(() => {
    if (!selected) return
    const token = localStorage.getItem('auth_token')
    fetch(`${apiUrl}/api/chat/${selected.conversation_id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setMessages)
  }, [selected, apiUrl])

  useEffect(() => {
    if (!selected || !user) return
    const token = localStorage.getItem('auth_token')
    const ws = new WebSocket(`${wsUrl}/api/chat/ws/${selected.booking_id}?token=${token}`)
    wsRef.current = ws
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data) as ChatMessage
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
    }
    return () => ws.close()
  }, [selected, user, wsUrl])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(input.trim())
    setInput('')
  }

  return (
    <AppShell mode="hub">
      <h1 className="text-xl font-bold text-dark mb-4">Messages</h1>
      <div className="flex flex-1 min-h-[60vh] -mx-4 md:mx-0">
        <aside className="w-64 border-r border-gray-100 p-3 hidden md:block">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-gray-500">No chats yet. Confirm a booking first.</p>
          ) : (
            <ul className="space-y-1">
              {conversations.map((c) => (
                <li key={c.conversation_id}>
                  <button
                    type="button"
                    onClick={() => setSelected(c)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
                      selected?.conversation_id === c.conversation_id
                        ? 'bg-primary-light text-primary font-medium'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {c.space_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="flex-1 flex flex-col">
          {selected ? (
            <>
              <div className="p-4 border-b border-gray-100">
                <p className="font-medium text-dark">{selected.space_name}</p>
                <Link
                  href={`/bookings/${selected.booking_id}`}
                  className="text-xs text-primary hover:underline"
                >
                  View booking
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.sender_user_id === user?.id
                        ? 'ml-auto bg-primary text-white'
                        : 'bg-gray-100 text-dark'
                    }`}
                  >
                    {msg.body}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="input flex-1"
                />
                <button type="button" onClick={sendMessage} className="btn-primary">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-8">
              Select a conversation or confirm a booking to start chatting.
            </div>
          )}
        </main>
      </div>
    </AppShell>
  )
}

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-8 text-gray-500">Loading messages...</div>}>
        <MessagesContent />
      </Suspense>
    </ProtectedRoute>
  )
}
