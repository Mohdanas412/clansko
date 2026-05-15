// app/(app)/messages/[connectionId]/page.jsx
'use client'
 
import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Sparkles, User, Clock, CheckCheck } from 'lucide-react'
 
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
 
export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const connectionId = params.connectionId
 
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
 
  const [currentUser, setCurrentUser] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
 
  const messagesEndRef = useRef(null)
  const currentUserRef = useRef(null)
 
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
 
  // ─── MAIN INIT + REALTIME SETUP ───────────────────────────────────────────
  useEffect(() => {
    let channel = null
 
    async function init() {
      // ✅ SAFE — auth check on client is fine
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
 
      const userRes = await fetch(`/api/users/${user.id}`)
      const userJson = await userRes.json()
      if (!userRes.ok) {
        router.push('/messages')
        return
      }
      setCurrentUser(userJson.data)
      currentUserRef.current = userJson.data
 
      // ✅ SECURE — API route now verifies auth + connection ownership server-side
      const msgRes = await fetch(`/api/messages?connectionId=${connectionId}`)
      const msgJson = await msgRes.json()
 
      if (!msgRes.ok) {
        router.push('/messages')
        return
      }
 
      setMessages(msgJson.data.messages || [])
 
      const otherId =
        msgJson.data.senderId === user.id
          ? msgJson.data.receiverId
          : msgJson.data.senderId
 
      const otherRes = await fetch(`/api/users/${otherId}`)
      const otherJson = await otherRes.json()
      if (otherRes.ok) setOtherUser(otherJson.data)
 
      setLoading(false)
      setTimeout(scrollToBottom, 100)
 
      // Mark messages as read
      fetch('/api/messages/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId }),
      }).catch(() => {})
 
      const channelName = `messages:${connectionId}`
      supabase.removeChannel(supabase.channel(channelName))
 
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `connection_id=eq.${connectionId}`
          },
          (payload) => {
            const newMsg = payload.new
            if (
              currentUserRef.current &&
              newMsg.sender_id !== currentUserRef.current.id
            ) {
              setMessages(prev => [...prev, newMsg])
              setTimeout(scrollToBottom, 100)
            }
          }
        )
        .subscribe()
    }
 
    init()
 
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [connectionId])
 
  // ─── SEND MESSAGE ─────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
 
    setSending(true)
    const messageText = newMessage
    setNewMessage('')
 
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content: messageText,
      sender_id: currentUserRef.current?.id,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])
    setTimeout(scrollToBottom, 100)
 
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: connectionId,
          // ✅ FIX: senderId removed — the API route now gets the sender identity
          // from the auth session (server-side cookie), so passing it from the
          // client is both unnecessary and a security risk (anyone could forge it).
          content: messageText,
        }),
      })
 
      const json = await res.json()
 
      if (!res.ok) {
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
        setNewMessage(messageText)
      } else {
        setMessages(prev =>
          prev.map(m => m.id === tempMsg.id ? json.data : m)
        )
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      setNewMessage(messageText)
    }
 
    setSending(false)
  }
 
  // ─── HELPERS ──────────────────────────────────────────────────────────────
  function formatTime(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
 
  function formatDate(timestamp) {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
 
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }
 
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(message)
    return groups
  }, {})
 
  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-100px)] flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground font-medium font-mono animate-pulse">Loading chat...</p>
      </div>
    )
  }
 
  return (
    <div className="w-full max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-card border border-border/80 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
      
      {/* ── STICKY CONVERSATION HEADER ── */}
      <div className="p-4 sm:p-5 border-b border-border/80 bg-background/80 backdrop-blur-md flex items-center justify-between gap-3 sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/messages')}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground shrink-0"
            title="Back to Messages"
          >
            <ArrowLeft size={16} />
          </Button>
 
          <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center font-extrabold text-xs text-primary shrink-0 overflow-hidden shadow-inner relative">
            {otherUser?.profile_photo ? (
              <img
                src={otherUser.profile_photo}
                alt={otherUser.name || ''}
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }}
              />
            ) : (
              <span>{otherUser?.name?.charAt(0).toUpperCase() || '?'}</span>
            )}
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-card" />
          </div>
 
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-foreground leading-none">
                {otherUser?.name || 'Student Builder'}
              </span>
              <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.2 rounded font-mono uppercase font-bold">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-none truncate max-w-xs">
              {otherUser?.college || 'Student Builder'}
            </p>
          </div>
        </div>
 
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/profile/${otherUser?.id}`)}
          className="rounded-xl text-xs h-8 px-3 shrink-0"
        >
          <User size={12} className="mr-1.5" />
          <span>View Profile</span>
        </Button>
      </div>
 
      {/* ── MESSAGES CANVAS AREA ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-gradient-to-b from-background/30 via-transparent to-background/30 space-y-4">
        
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-12">
            <div className="p-3 rounded-full bg-primary/5 text-primary">
              <Sparkles size={20} />
            </div>
            <p className="text-xs font-bold text-foreground">Start the Conversation</p>
            <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed font-normal">
              Say hi, talk about what you are building, or brainstorm ideas together.
            </p>
          </div>
        )}
 
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date} className="space-y-3 pt-2">
            <div className="flex items-center justify-center my-3">
              <span className="px-3 py-1 rounded-full bg-secondary/60 text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono border">
                {formatDate(msgs[0].created_at)}
              </span>
            </div>
 
            {msgs.map((message, index) => {
              const isOwn = message.sender_id === currentUserRef.current?.id
              const showAvatar = index === 0 || msgs[index - 1].sender_id !== message.sender_id
 
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.1 }}
                  className={cn(
                    "flex items-end gap-2 group transition-all",
                    isOwn ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {!isOwn && (
                    <div className={cn(
                      "w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center font-bold text-[10px] text-primary shrink-0 overflow-hidden shadow-xs",
                      !showAvatar && "invisible"
                    )}>
                      {otherUser?.profile_photo ? (
                        <img
                          src={otherUser.profile_photo}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <span>{otherUser?.name?.charAt(0).toUpperCase() || '?'}</span>
                      )}
                    </div>
                  )}
 
                  <div className="max-w-[75%] sm:max-w-[70%]">
                    <div className={cn(
                      "px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed rounded-2xl whitespace-pre-wrap word-break-break-word font-normal transition-all",
                      isOwn 
                        ? "bg-primary text-white rounded-br-xs shadow-xs" 
                        : "bg-background text-foreground border border-border/80 rounded-bl-xs shadow-xs"
                    )}>
                      {message.content}
                    </div>
 
                    <div className={cn(
                      "text-[9px] text-muted-foreground mt-1 px-1 font-medium font-mono opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
                      isOwn ? "justify-end" : "justify-start"
                    )}>
                      <Clock size={9} className="opacity-40" />
                      <span>{formatTime(message.created_at)}</span>
                      {isOwn && <CheckCheck size={10} className="text-primary ml-0.5" />}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ))}
 
        <div ref={messagesEndRef} />
      </div>
 
      {/* ── INPUT ── */}
      <div className="p-4 border-t border-border/80 bg-background/80 backdrop-blur-md shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center bg-card border border-border rounded-xl px-3 py-1.5 focus-within:border-primary transition-all shadow-inner">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Write a message..."
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-foreground py-1 pr-20 font-sans"
          />
          <Button
            type="submit"
            size="sm"
            disabled={sending || !newMessage.trim()}
            className={cn(
              "absolute right-2 h-8 px-3 rounded-lg text-xs font-bold transition-all shrink-0",
              newMessage.trim() && !sending 
                ? "bg-primary text-white shadow-xs" 
                : "bg-secondary text-muted-foreground opacity-50 cursor-not-allowed"
            )}
          >
            <Send size={12} className="mr-1 sm:inline hidden" />
            <span>{sending ? '...' : 'Send'}</span>
          </Button>
        </form>
      </div>
 
    </div>
  )
}