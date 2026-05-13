// components/SkoChat.jsx
// Redesigned AI Copilot & Execution Partner Experience — Hybrid Premium Community SaaS theme

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, 
  Send, 
  X, 
  RotateCcw, 
  Compass, 
  Target, 
  Users, 
  Briefcase, 
  Layers, 
  Cpu,
  Flame,
  CheckCircle2,
  HelpCircle,
  Calendar
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

// Thematic onboarding structured guidance categories
const SUGGESTION_TRACKS = [
  {
    category: "Startup Strategy",
    icon: Briefcase,
    colorClass: "text-amber-600 bg-amber-50 border-amber-200",
    prompts: [
      "Find builders for my startup idea",
      "Generate startup validation questions",
      "Suggest viable niche project ideas"
    ]
  },
  {
    category: "Execution Roadmaps",
    icon: Layers,
    colorClass: "text-blue-600 bg-blue-50 border-blue-200",
    prompts: [
      "Create a roadmap for my project",
      "Build a weekly execution plan",
      "Break my idea down into the next 4 weeks"
    ]
  },
  {
    category: "Accountability Sync",
    icon: Target,
    colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200",
    prompts: [
      "Help me stay accountable this week",
      "Suggest potential teammates on campus",
      "Pinpoint flaws in my core MVP logic"
    ]
  }
]

// Animated Typing Pulse Component
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 py-1">
      <div className="w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-[10px] text-primary shrink-0 mt-0.5">
        <Sparkles size={12} className="fill-primary/20 animate-pulse" />
      </div>
      <div className="bg-secondary/40 border border-border/60 rounded-2xl rounded-tl-sm px-3.5 py-3 flex items-center gap-1.5 shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-[bounce_1s_infinite_0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-[bounce_1s_infinite_200ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-[bounce_1s_infinite_400ms]" />
        <span className="text-[10px] text-muted-foreground ml-1 font-medium font-mono">Thinking...</span>
      </div>
    </div>
  )
}

// Chat Bubble Element
function Message({ msg }) {
  const isUser = msg.role === 'user'

  return (
    <div className={cn(
      "flex items-end gap-2 mb-4 group transition-all",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      
      {/* Avatar node */}
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mb-1">
          <Cpu size={12} className="text-primary" />
        </div>
      )}

      <div className="max-w-[85%] sm:max-w-[80%]">
        <div className={cn(
          "px-4 py-3 text-xs sm:text-sm leading-relaxed rounded-2xl whitespace-pre-wrap word-break-break-word font-normal transition-all",
          isUser 
            ? "bg-primary text-white rounded-br-xs shadow-sm" 
            : "bg-card text-foreground border border-border/80 rounded-bl-xs shadow-xs"
        )}>
          {msg.text}
        </div>
        
        {/* Subtle delivery timestamps */}
        <div className={cn(
          "text-[9px] text-muted-foreground mt-1 px-1 font-medium font-mono opacity-0 group-hover:opacity-100 transition-opacity",
          isUser ? "text-right" : "text-left"
        )}>
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

  // Fluid Auto-scroll Trigger
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Contextual input grabber
  useEffect(() => {
    if (isOpen && hasStarted) {
      const timer = setTimeout(() => inputRef.current?.focus(), 250)
      return () => clearTimeout(timer)
    }
  }, [isOpen, hasStarted])

  function getTime() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  // Pure data conversion exactly mirroring legacy specification schema
  function toGroqMessages(msgs) {
    return msgs.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }))
  }

  async function sendMessage(text) {
    if (!text || !text.trim() || isLoading) return

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

      if (!res.ok) throw new Error(data.error || 'Network error. Please try again.')

      setMessages(prev => [
        ...prev,
        { role: 'sko', text: data.reply, time: getTime() },
      ])
    } catch (err) {
      setError(err.message || 'Failed to get a response. Please try again.')
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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent Backdrop overlay layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/40 backdrop-blur-xs z-[100]"
          />

          {/* Premium Floating Drawer Frame */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-card/95 backdrop-blur-2xl border-l border-border z-[101] flex flex-col shadow-2xl shadow-black/5 overflow-hidden"
          >
            
            {/* ── HEADER REGION ── */}
            <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-background/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner shrink-0 relative">
                  <Sparkles size={18} className="text-primary animate-pulse" />
                  {/* Active dot indicator */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-foreground tracking-tight leading-none">Sko Copilot</span>
                    <span className="text-[9px] font-bold font-mono bg-primary/10 text-primary px-1.5 py-0.2 rounded uppercase">v2.4 Live</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-none">
                    Your AI copilot for building, brainstorming, and planning
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {messages.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => { setMessages([]); setHasStarted(false); setError(null) }} 
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                    title="Clear Chat"
                  >
                    <RotateCcw size={14} />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose} 
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Minimize Drawer"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>

            {/* ── CONVERSATION LOGS / ONBOARDING CANVAS ── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar bg-gradient-to-b from-background/30 via-transparent to-background/30">
              
              {!hasStarted ? (
                <div className="space-y-6 pt-2 animate-in fade-in duration-300">
                  
                  {/* Hero greeting statement */}
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs font-bold text-muted-foreground border">
                      <Cpu size={12} className="text-primary" />
                      <span>Builder Copilot</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                      What are we building today?
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                      Ask Sko to help you brainstorm ideas, break down your weekly goals, or plan your startup roadmap.
                    </p>
                  </div>

                  {/* Curated Track Matrix */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                      Suggested Topics
                    </p>

                    <div className="space-y-3">
                      {SUGGESTION_TRACKS.map((track, idx) => {
                        const TrackIcon = track.icon
                        return (
                          <div key={idx} className="p-3.5 rounded-xl border border-border/80 bg-card space-y-2.5 hover:border-border transition-colors">
                            <div className="flex items-center gap-2">
                              <span className={cn("p-1 rounded-lg border text-xs", track.colorClass)}>
                                <TrackIcon size={12} />
                              </span>
                              <span className="text-xs font-bold text-foreground">{track.category}</span>
                            </div>

                            <div className="space-y-1.5 pt-0.5">
                              {track.prompts.map((promptText, pIdx) => (
                                <button
                                  key={pIdx}
                                  onClick={() => sendMessage(promptText)}
                                  className="w-full text-left p-2 rounded-lg bg-secondary/30 hover:bg-primary/5 hover:text-primary transition-all border border-transparent hover:border-primary/10 text-xs text-muted-foreground flex items-center justify-between group"
                                >
                                  <span className="font-normal truncate pr-2 leading-tight">{promptText}</span>
                                  <Send size={10} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Micro reassurance trust banner */}
                  <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      🔒 Your chats are private and anonymous.
                    </p>
                  </div>

                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Message msg={msg} />
                    </motion.div>
                  ))}

                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <TypingIndicator />
                    </motion.div>
                  )}

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700 flex items-center justify-between mt-2">
                      <span className="font-medium">{error}</span>
                      <Button variant="outline" size="sm" onClick={handleRetry} className="border-red-200 text-red-700 hover:bg-red-100/50 text-[11px] h-7 px-2.5">
                        Retry
                      </Button>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

            </div>

            {/* ── USER INTERACTION INPUT AREA ── */}
            <div className="p-4 border-t border-border/60 bg-card/60 shrink-0">
              <div className="relative flex items-center bg-background border border-border rounded-xl px-3 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all shadow-inner">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Sko anything about your project, tech stack, or ideas..."
                  rows={1}
                  className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-foreground resize-none leading-relaxed max-h-[100px] py-1.5 pr-10 overflow-y-auto custom-scrollbar font-sans"
                  onInput={e => {
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
                  }}
                />

                <Button
                  size="icon"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "absolute right-2 h-8 w-8 rounded-lg shrink-0 transition-all",
                    input.trim() && !isLoading 
                      ? "bg-primary text-white shadow-xs" 
                      : "bg-secondary text-muted-foreground opacity-50 hover:bg-secondary cursor-not-allowed"
                  )}
                >
                  <Send size={13} className={cn(input.trim() && !isLoading && "translate-x-0.5")} />
                </Button>
              </div>

              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[9px] text-muted-foreground font-medium">
                  Press Enter to send <span className="opacity-60">•</span> Shift+Enter for soft break
                </span>
                <span className="text-[9px] font-bold text-primary font-mono tracking-wider uppercase">
                  Copilot Ready
                </span>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}