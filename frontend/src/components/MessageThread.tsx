'use client'

import { Conversation, ChatMessage, WsStatus, formatMessageTime } from '@/lib/chat'

interface MessageThreadProps {
  conversation: Conversation
  messages: ChatMessage[]
  currentUserId?: string
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  wsStatus: WsStatus
  messagesEndRef: React.RefObject<HTMLDivElement>
}

function wsStatusLabel(status: WsStatus): string | null {
  if (status === 'connecting') return 'Connecting...'
  if (status === 'closed') return 'Disconnected. Go back and reopen this chat to reconnect.'
  return null
}

export function MessageThread({
  conversation,
  messages,
  currentUserId,
  input,
  onInputChange,
  onSend,
  wsStatus,
  messagesEndRef,
}: MessageThreadProps) {
  const statusText = wsStatusLabel(wsStatus)
  const canSend = wsStatus === 'open' && input.trim().length > 0

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-primary-light/30">
        <p className="text-sm text-gray-500 text-center">
          {conversation.space_location || 'Bolzano'} · With {conversation.other_party_name}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No messages yet. Say hello to {conversation.other_party_name}.
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_user_id === currentUserId
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMine ? 'bg-primary text-white' : 'bg-gray-100 text-dark'
                  }`}
                >
                  {msg.body}
                </div>
                <span className="text-[11px] text-gray-400 mt-1 px-1">
                  {formatMessageTime(msg.created_at)}
                </span>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {statusText && (
        <p className="px-4 pb-2 text-xs text-amber-700 text-center">{statusText}</p>
      )}

      <div className="p-4 border-t border-gray-100 flex gap-2 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && canSend && onSend()}
          placeholder="Type a message..."
          className="input-lavender flex-1"
          disabled={wsStatus !== 'open'}
        />
        <button
          type="button"
          onClick={onSend}
          className="btn-primary shrink-0 disabled:opacity-50"
          disabled={!canSend}
        >
          Send
        </button>
      </div>
    </div>
  )
}
