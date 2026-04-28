'use client'

import { useEffect, useRef, useState } from 'react'

interface Message {
  role: 'ai' | 'user'
  text: string
}

interface AiCareChatProps {
  initialMessages?: Message[]
  onSend?: (message: string) => Promise<string>
}

const DEFAULT_MESSAGES: Message[] = [
  {
    role: 'ai',
    text: 'Brain problems can manifest in various ways, and symptoms may include headaches, memory issues, changes in mood or behavior, difficulty concentrating, or physical coordination problems.',
  },
]

const FALLBACK_REPLY = 'I understand your concern. Please provide more details so I can assist you better.'

export function AiCareChat({
  initialMessages = DEFAULT_MESSAGES,
  onSend,
}: AiCareChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    setInput('')
    setSending(true)
    setMessages(prev => [...prev, { role: 'user', text }])

    try {
      const reply = onSend ? await onSend(text) : FALLBACK_REPLY
      setMessages(prev => [...prev, { role: 'ai', text: reply }])
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="ai-care-section">
      {/* Header */}
      <div className="ai-care-header">
        <div className="ai-care-info">
          <div className="ai-care-avatar">🧠</div>
          <div className="ai-care-details">
            <h3 className="ai-care-name">AI Care</h3>
            <p className="ai-care-status">Always here to help</p>
          </div>
        </div>
        <button className="right-panel-action" aria-label="Search">
          <i className="fas fa-search" />
        </button>
      </div>

      {/* Message list */}
      <div className="messages-container">
        {messages.map((msg, i) => (
          <div key={i} className={`message${msg.role === 'user' ? ' user' : ''}`}>
            <div className={`message-bubble ${msg.role}`}>{msg.text}</div>
          </div>
        ))}
        {sending && (
          <div className="message">
            <div className="message-bubble ai" style={{ opacity: 0.6 }}>
              <i className="fas fa-circle-notch fa-spin" style={{ marginRight: '0.5rem' }} />
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <input
            type="text"
            placeholder="Ask AI Care…"
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <button
            className="chat-send-button"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            aria-label="Send"
          >
            <i className="fas fa-paper-plane" />
          </button>
        </div>
      </div>
    </div>
  )
}
