/**
 * Messages — booking overview list, then chat per booking (?booking=).
 */

'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { ConversationOverviewCard } from '@/components/ConversationOverviewCard'
import { MessageThread } from '@/components/MessageThread'
import { useAuth } from '@/lib/auth'
import {
  Conversation,
  ChatMessage,
  WsStatus,
  fetchConversations,
  fetchMessages,
  openChatSocket,
} from '@/lib/chat'
import { OwnerBooking } from '@/lib/bookings'

function ChatUnavailablePanel({
  bookingId,
  booking,
  onBack,
}: {
  bookingId: string
  booking: OwnerBooking | null
  onBack: () => void
}) {
  const isPending = booking?.status === 'pending'
  const notFound = booking === null

  return (
    <div className="text-center py-12 space-y-3">
      {notFound ? (
        <p className="text-gray-600 text-sm">
          Conversation not found or you do not have access to this booking.
        </p>
      ) : isPending ? (
        <p className="text-gray-600 text-sm">
          Chat opens after the host accepts your request.
        </p>
      ) : (
        <p className="text-gray-600 text-sm">
          Chat is not available for this booking.
        </p>
      )}
      <div className="flex flex-col gap-2 items-center">
        {booking && (
          <Link
            href={`/bookings/${bookingId}`}
            className="text-primary hover:underline text-sm"
          >
            View booking details
          </Link>
        )}
        <button
          type="button"
          onClick={onBack}
          className="text-primary hover:underline text-sm"
        >
          Back to messages
        </button>
      </div>
    </div>
  )
}

function MessagesContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingParam = searchParams.get('booking')
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [unavailableBooking, setUnavailableBooking] = useState<OwnerBooking | null | undefined>(undefined)
  const [wsStatus, setWsStatus] = useState<WsStatus>('closed')
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeConversation = bookingParam
    ? conversations.find((c) => c.booking_id === bookingParam) ?? null
    : null

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    fetchConversations(token, apiUrl)
      .then(setConversations)
      .finally(() => setLoading(false))
  }, [apiUrl])

  useEffect(() => {
    if (!bookingParam || loading || activeConversation) {
      setUnavailableBooking(undefined)
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) return

    fetch(`${apiUrl}/api/bookings/${bookingParam}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (response.status === 404) {
          setUnavailableBooking(null)
          return
        }
        if (!response.ok) {
          setUnavailableBooking(null)
          return
        }
        setUnavailableBooking(await response.json())
      })
      .catch(() => setUnavailableBooking(null))
  }, [bookingParam, loading, activeConversation, apiUrl])

  useEffect(() => {
    if (!activeConversation) {
      setMessages([])
      return
    }
    const token = localStorage.getItem('auth_token')
    if (!token) return

    fetchMessages(activeConversation.conversation_id, token, apiUrl)
      .then(setMessages)
      .catch(() => setMessages([]))
  }, [activeConversation, apiUrl])

  useEffect(() => {
    if (!activeConversation || !user) return
    const token = localStorage.getItem('auth_token')
    if (!token) return

    const ws = openChatSocket(
      activeConversation.booking_id,
      token,
      (msg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      },
      setWsStatus,
      apiUrl
    )
    wsRef.current = ws
    return () => {
      ws.close()
      wsRef.current = null
      setWsStatus('closed')
    }
  }, [activeConversation, user, apiUrl])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(input.trim())
    setInput('')
  }

  if (bookingParam) {
    if (!loading && !activeConversation) {
      return (
        <AppShell mode="hub" variant="minimal">
          <div className="max-w-xl mx-auto">
            <PageHeader title="Messages" onBack={() => router.push('/messages')} />
            {unavailableBooking === undefined ? (
              <p className="text-gray-600 text-sm text-center py-12">Loading...</p>
            ) : (
              <ChatUnavailablePanel
                bookingId={bookingParam}
                booking={unavailableBooking}
                onBack={() => router.push('/messages')}
              />
            )}
          </div>
        </AppShell>
      )
    }

    return (
      <AppShell mode="hub" variant="minimal">
        <div className="max-w-xl mx-auto">
          <PageHeader
            title={activeConversation?.space_name ?? 'Chat'}
            onBack={() => router.push('/messages')}
          />
          {activeConversation && (
            <MessageThread
              conversation={activeConversation}
              messages={messages}
              currentUserId={user?.id}
              input={input}
              onInputChange={setInput}
              onSend={sendMessage}
              wsStatus={wsStatus}
              messagesEndRef={messagesEndRef}
            />
          )}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell mode="hub" variant="minimal">
      <div className="max-w-xl mx-auto">
        <PageHeader title="Messages" onBack={() => router.push('/dashboard')} />

        <p className="text-gray-500 text-sm text-center mb-6">
          Chats with hosts and artists for confirmed bookings.
        </p>

        {loading ? (
          <p className="text-gray-600 text-sm text-center py-12">Loading conversations...</p>
        ) : conversations.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-12">
            No chats yet. Chats appear here once a booking is confirmed.
          </p>
        ) : (
          <ul className="space-y-3">
            {conversations.map((conversation) => (
              <li key={conversation.conversation_id}>
                <ConversationOverviewCard conversation={conversation} />
              </li>
            ))}
          </ul>
        )}
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
