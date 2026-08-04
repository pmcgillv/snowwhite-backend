import { useState, useRef, useEffect, FormEvent } from 'react'
import { IconSend } from '../components/Icons'
import type { AdvisorMessage } from '../api/client'

const BASE_URL = (import.meta.env?.VITE_API_URL as string | undefined) ?? ''

const STARTERS = [
  'How can I pay off my credit card faster?',
  'Should I build an emergency fund or pay debt first?',
  'What is the avalanche vs snowball method?',
  "Explain my debt-free date projection",
]

const INITIAL_MESSAGES: AdvisorMessage[] = [
  {
    role: 'assistant',
    content:
      "Hi, I'm your Ledgerline advisor. I can help you understand your financial strategy, explain projections, and suggest ways to accelerate your debt payoff. What would you like to explore?",
  },
]

export default function Advisor() {
  const [messages, setMessages] = useState<AdvisorMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    if (!text.trim() || sending) return
    const userMsg: AdvisorMessage = { role: 'user', content: text.trim() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setSending(true)
    setError(null)

    try {
      const res = await fetch(`${BASE_URL}/api/advisor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = (await res.json()) as { message: string }
      setMessages(m => [...m, { role: 'assistant', content: data.message }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      const isNetwork = msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')
      setError(
        isNetwork
          ? 'Could not reach the advisor API. Make sure the server is running.'
          : `Error: ${msg}`,
      )
    } finally {
      setSending(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  return (
    <div className="app-page page-enter" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - var(--sp-8))' }} role="main" aria-labelledby="advisor-title">
      <header className="app-page__header" style={{ flexShrink: 0 }}>
        <h1 className="app-page__title" id="advisor-title">Advisor</h1>
        <p className="app-page__subtitle">Chat with your personal financial advisor.</p>
      </header>

      <div className="advisor-panel" style={{ flex: 1 }}>
        <div
          className="advisor-messages"
          role="log"
          aria-live="polite"
          aria-label="Conversation"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`advisor-msg advisor-msg--${msg.role}`}
              aria-label={`${msg.role === 'user' ? 'You' : 'Advisor'}: ${msg.content}`}
            >
              <div className="advisor-msg__role">
                {msg.role === 'user' ? 'You' : 'Ledgerline Advisor'}
              </div>
              {msg.content}
            </div>
          ))}

          {sending && (
            <div className="advisor-msg advisor-msg--ai" aria-label="Advisor is typing">
              <div className="advisor-msg__role">Ledgerline Advisor</div>
              <span style={{ opacity: 0.5 }}>Thinking…</span>
            </div>
          )}

          {error && (
            <div
              style={{
                background: 'rgba(192,80,58,0.12)',
                border: '1px solid rgba(192,80,58,0.25)',
                borderRadius: 'var(--r-md)',
                padding: 'var(--sp-3) var(--sp-4)',
                fontSize: 'var(--text-sm)',
                color: '#E06A54',
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick starters */}
        {messages.length <= 1 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--sp-2)',
              padding: 'var(--sp-3) var(--sp-5)',
              background: 'var(--panel-hi)',
              borderLeft: '1px solid var(--border)',
              borderRight: '1px solid var(--border)',
            }}
            aria-label="Suggested questions"
          >
            {STARTERS.map(s => (
              <button
                key={s}
                className="btn btn-ghost btn-sm"
                onClick={() => void send(s)}
                style={{ fontSize: 'var(--text-xs)' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form className="advisor-input-bar" onSubmit={onSubmit} aria-label="Send a message">
          <textarea
            className="advisor-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send(input)
              }
            }}
            placeholder="Ask anything about your finances…"
            rows={1}
            disabled={sending}
            aria-label="Message input"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || !input.trim()}
            aria-label="Send message"
          >
            <IconSend size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
