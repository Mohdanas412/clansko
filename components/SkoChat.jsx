// components/SkoChat.jsx

'use client'

import { useState, useEffect, useRef } from 'react'

const STARTER_PROMPTS = [
  'Is my idea actually viable?',
  'What should I build first?',
  'Who should I look for as cofounder?',
  'Break my idea into next 4 weeks',
  'What are 3 good goals for this week?',
  'What is wrong with my thinking here?',
]

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0' }}>
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: '#F9731620',
        border: '1px solid #F9731640',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: '700',
        color: '#F97316',
        flexShrink: 0,
      }}>S</div>
      <div style={{
        backgroundColor: '#1E1E1E',
        borderRadius: '12px 12px 12px 2px',
        padding: '10px 14px',
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#9A9A8A',
            display: 'inline-block',
            animation: 'skoBounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes skoBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '8px',
      marginBottom: '16px',
    }}>
      {!isUser && (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: '#F9731620',
          border: '1px solid #F9731640',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '700',
          color: '#F97316',
          flexShrink: 0,
        }}>S</div>
      )}

      <div style={{ maxWidth: '80%' }}>
        <div style={{
          backgroundColor: isUser ? '#F97316' : '#1E1E1E',
          color: isUser ? '#111111' : '#F5F0E8',
          borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
          padding: '10px 14px',
          fontSize: '14px',
          lineHeight: '1.55',
          fontFamily: 'DM Sans, sans-serif',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {msg.text}
        </div>
        <div style={{
          fontSize: '11px',
          color: '#6A6A5A',
          marginTop: '4px',
          textAlign: isUser ? 'right' : 'left',
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {msg.time}
        </div>
      </div>
    </div>
  )
}

export default function SkoChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasStarted, setHasStarted] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen && hasStarted) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, hasStarted])

  function getTime() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  // Convert messages to Groq format
  function toGroqMessages(msgs) {
    return msgs.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }))
  }

  async function sendMessage(text) {
    if (!text.trim() || isLoading) return

    setError(null)
    setHasStarted(true)

    const userMsg = { role: 'user', text: text.trim(), time: getTime() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/sko/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: toGroqMessages(updatedMessages) }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Something went wrong')

      setMessages(prev => [
        ...prev,
        { role: 'sko', text: data.reply, time: getTime() },
      ])
    } catch (err) {
      setError(err.message || 'Failed to reach Sko. Try again.')
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleRetry() {
    setError(null)
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    if (lastUser) sendMessage(lastUser.text)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="sko-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'none',
          }}
        />
      )}

      {/* Panel */}
      <div
        className="sko-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '380px',
          backgroundColor: '#161616',
          borderLeft: '1px solid #1E1E1E',
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: 'DM Sans, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1E1E1E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#F9731620',
              border: '1px solid #F9731640',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '700',
              color: '#F97316',
            }}>S</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#F5F0E8' }}>Sko</div>
              <div style={{ fontSize: '11px', color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ADE80', display: 'inline-block' }} />
                Your thinking partner
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid #2A2A2A',
              borderRadius: '6px',
              color: '#9A9A8A',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '18px',
              lineHeight: 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#F97316'
              e.currentTarget.style.color = '#F97316'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#2A2A2A'
              e.currentTarget.style.color = '#9A9A8A'
            }}
          >×</button>
        </div>

        {/* ── Messages / Starter prompts ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#2A2A2A transparent',
        }}>
          {!hasStarted ? (
            <div>
              <div style={{
                width: '28px',
                height: '3px',
                backgroundColor: '#F97316',
                borderRadius: '2px',
                marginBottom: '16px',
              }} />
              <p style={{ fontSize: '13px', color: '#9A9A8A', marginBottom: '4px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Sko knows your project
              </p>
              <p style={{ fontSize: '15px', color: '#F5F0E8', marginBottom: '24px', lineHeight: '1.5' }}>
                Ask anything. Get honest, specific answers — not generic advice.
              </p>
              <p style={{ fontSize: '12px', color: '#6A6A5A', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>
                Try asking
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {STARTER_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      background: 'none',
                      border: '1px solid #1E1E1E',
                      borderRadius: '8px',
                      color: '#F5F0E8',
                      cursor: 'pointer',
                      padding: '10px 14px',
                      fontSize: '13px',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#F97316'
                      e.currentTarget.style.color = '#F97316'
                      e.currentTarget.style.backgroundColor = '#F9731608'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#1E1E1E'
                      e.currentTarget.style.color = '#F5F0E8'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {messages.map((msg, i) => (
                <Message key={i} msg={msg} />
              ))}
              {isLoading && <TypingIndicator />}
              {error && (
                <div style={{
                  backgroundColor: '#FCA5A510',
                  border: '1px solid #FCA5A530',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '12px',
                }}>
                  <p style={{ fontSize: '13px', color: '#FCA5A5', margin: '0 0 8px 0' }}>{error}</p>
                  <button
                    onClick={handleRetry}
                    style={{
                      background: 'none',
                      border: '1px solid #FCA5A540',
                      borderRadius: '6px',
                      color: '#FCA5A5',
                      cursor: 'pointer',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >Retry</button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input ── */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #1E1E1E',
          flexShrink: 0,
        }}>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-end',
              backgroundColor: '#111111',
              border: '1px solid #2A2A2A',
              borderRadius: '10px',
              padding: '10px 12px',
              transition: 'border-color 0.15s',
            }}
            onFocusCapture={e => e.currentTarget.style.borderColor = '#F97316'}
            onBlurCapture={e => e.currentTarget.style.borderColor = '#2A2A2A'}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Sko anything..."
              rows={1}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#F5F0E8',
                fontSize: '14px',
                fontFamily: 'DM Sans, sans-serif',
                resize: 'none',
                lineHeight: '1.5',
                maxHeight: '120px',
                overflowY: 'auto',
              }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              style={{
                backgroundColor: input.trim() && !isLoading ? '#F97316' : '#2A2A2A',
                color: input.trim() && !isLoading ? '#111' : '#6A6A5A',
                border: 'none',
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#6A6A5A', marginTop: '8px', textAlign: 'center' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .sko-panel { width: 100vw !important; }
          .sko-backdrop { display: block !important; }
        }
        .sko-panel ::-webkit-scrollbar { width: 4px; }
        .sko-panel ::-webkit-scrollbar-track { background: transparent; }
        .sko-panel ::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 2px; }
      `}</style>
    </>
  )
}