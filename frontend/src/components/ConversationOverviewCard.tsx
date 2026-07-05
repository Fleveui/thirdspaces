'use client'

import { useRouter } from 'next/navigation'
import { Conversation, formatMessageTime, messagesChatHref } from '@/lib/chat'
import { formatDateRange } from '@/lib/bookings'

function spaceInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface ConversationOverviewCardProps {
  conversation: Conversation
}

export function ConversationOverviewCard({ conversation }: ConversationOverviewCardProps) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(messagesChatHref(conversation.booking_id))}
      className="w-full text-left bg-white rounded-3xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-light text-primary font-semibold flex items-center justify-center shrink-0">
          {spaceInitials(conversation.space_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="font-bold text-dark">{conversation.space_name}</p>
              <p className="text-sm text-gray-500">
                {conversation.space_location || 'Bolzano'}
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 shrink-0">
              Confirmed
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            With {conversation.other_party_name}
          </p>
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {formatDateRange(conversation.start_date, conversation.end_date)}
          </p>
          {conversation.last_message_body && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
              {conversation.last_message_at && (
                <span className="text-gray-400 mr-1.5">
                  {formatMessageTime(conversation.last_message_at)}
                </span>
              )}
              {conversation.last_message_body}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
