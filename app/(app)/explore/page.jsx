// app/(app)/explore/page.jsx
'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { 
  Search, 
  Sparkles, 
  Users, 
  MapPin, 
  GraduationCap, 
  CheckCircle2, 
  Send, 
  Plus, 
  Filter, 
  X,
  UserPlus,
  Compass
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { UserCardSkeleton } from '@/components/Skeleton'

export default function ExplorePage() {
  const [currentUserId, setCurrentUserId] = useState(null)
  const [users, setUsers] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [connectingTo, setConnectingTo] = useState(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUserId(user.id)
        await fetchData(user.id)
      } catch (err) {
        setError('Failed to load users. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function fetchData(userId) {
    const [usersRes, connectionsRes] = await Promise.all([
      fetch(`/api/users?userId=${userId}`),
      fetch(`/api/connections?userId=${userId}`),
    ])
    const usersData = await usersRes.json()
    const connectionsData = await connectionsRes.json()
    if (usersData.error) throw new Error(usersData.error)
    if (connectionsData.error) throw new Error(connectionsData.error)
    setUsers(usersData.data || [])
    setConnections(connectionsData.data || [])
  }

  async function handleRespond(connectionId) {
    try {
      const res = await fetch('/api/connections/respond', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, userId: currentUserId, status: 'accepted' }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setConnections(prev =>
        prev.map(c => c.connectionId === connectionId ? { ...c, status: 'accepted' } : c)
      )
      toast.success('Connected! 🎉')
    } catch (err) {
      toast.error('Something went wrong.')
    }
  }

  async function handleConnect(receiverId) {
    setConnectingTo(receiverId)
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUserId, receiverId }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setConnections(prev => [...prev, {
        connectionId: data.data.id,
        status: 'pending',
        direction: 'sent',
        otherUser: { id: receiverId },
      }])
      toast.success('Connection request sent!')
    } catch (err) {
      toast.error('Network failure occurred. Try again later.')
    } finally {
      setConnectingTo(null)
    }
  }

  function getConnectionStatus(otherUserId) {
    const match = connections.find(c => c.otherUser?.id === otherUserId)
    if (!match) return { status: 'none' }
    return { status: match.status, connectionId: match.connectionId, direction: match.direction }
  }

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = !query ||
      user.name?.toLowerCase().includes(query) ||
      user.college?.toLowerCase().includes(query) ||
      user.bio?.toLowerCase().includes(query)
    const matchesSkill = !skillFilter ||
      (Array.isArray(user.skills) && user.skills.includes(skillFilter))
    return matchesSearch && matchesSkill
  })

  const allSkills = [...new Set(
    users.flatMap(u => Array.isArray(u.skills) ? u.skills : [])
  )].sort()

  if (loading) {
    return (
      <div className="w-full space-y-8 animate-in fade-in duration-300">
        <div className="space-y-2 pb-4 border-b border-border/60">
          <div className="w-32 h-3 rounded-full bg-secondary animate-pulse" />
          <div className="w-48 h-6 rounded-lg bg-secondary animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UserCardSkeleton /><UserCardSkeleton /><UserCardSkeleton />
          <UserCardSkeleton /><UserCardSkeleton /><UserCardSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 border-red-200 bg-red-50/50 text-red-800 text-center max-w-md mx-auto space-y-3">
        <p className="font-bold text-sm">{error}</p>
        <Button size="sm" onClick={() => window.location.reload()} className="h-8 text-xs">
          Reload Page
        </Button>
      </Card>
    )
  }

  return (
    <div className="w-full animate-in fade-in duration-300">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-bold tracking-widest text-primary uppercase font-mono">
              EXPLORE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Explore Companions
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Find other students building cool things, check out their stack, and connect.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1.5 rounded-xl border border-border/60 shrink-0">
          <Users size={14} className="text-primary" />
          <span className="text-xs font-bold text-foreground">
            {users.length} Builder{users.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── SEARCH & FILTER RIBBONS ── */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 pb-8">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, college, skills, or bio..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs sm:text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all shadow-inner font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative shrink-0 w-full sm:w-auto">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <select
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              className={cn(
                "pl-8 pr-8 py-2.5 rounded-xl bg-card border border-border text-xs sm:text-sm outline-none cursor-pointer appearance-none transition-all w-full sm:w-44 font-sans",
                skillFilter ? "text-primary font-bold border-primary/40 bg-primary/5" : "text-muted-foreground"
              )}
            >
              <option value="">All Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          {(searchQuery || skillFilter) && (
            <Button
              variant="ghost"
              onClick={() => { setSearchQuery(''); setSkillFilter('') }}
              className="h-10 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground shrink-0"
              title="Clear filters"
            >
              <X size={14} className="mr-1" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── EMPTY STATE ── */}
      {filteredUsers.length === 0 && (
        <Card className="p-12 text-center border-dashed border-border/80 bg-secondary/10 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
            <Compass size={24} />
          </div>
          <p className="text-sm font-bold text-foreground">No builders found</p>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-normal">
            {searchQuery || skillFilter 
              ? "No students match your search filters. Try changing your search query or skill filter."
              : "No other builders found right now."}
          </p>
          {(searchQuery || skillFilter) && (
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSkillFilter('') }} className="text-xs h-8">
              Clear Filters
            </Button>
          )}
        </Card>
      )}

      {/* ── COMPANION GRID CARDS STREAM ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user, idx) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            className="flex"
          >
            <UserCard
              user={user}
              connectionInfo={getConnectionStatus(user.id)}
              onConnect={handleConnect}
              onRespond={handleRespond}
              isConnecting={connectingTo === user.id}
            />
          </motion.div>
        ))}
      </div>

    </div>
  )
}

// ── LAYERED EXPLORE COMPANION CARD ─────────────────────────────────────────────
function UserCard({ user, connectionInfo, onConnect, onRespond, isConnecting }) {
  const { status, direction } = connectionInfo

  function getButtonConfig() {
    if (status === 'accepted') return { 
      label: 'Connected', 
      disabled: true, 
      variantStyle: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 opacity-100 hover:bg-emerald-500/10 cursor-default font-bold",
      icon: CheckCircle2
    }
    if (status === 'pending' && direction === 'sent') return { 
      label: 'Request Sent', 
      disabled: true, 
      variantStyle: "bg-secondary text-muted-foreground border border-border/80 opacity-70 cursor-not-allowed",
      icon: Send
    }
    if (status === 'pending' && direction === 'received') return { 
      label: 'Accept Request', 
      disabled: false, 
      variantStyle: "bg-primary text-white shadow-xs hover:shadow-md hover:shadow-primary/30 font-bold",
      icon: Plus
    }
    return { 
      label: isConnecting ? 'Sending...' : 'Connect', 
      disabled: isConnecting, 
      variantStyle: "bg-card text-foreground border border-border hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all font-semibold",
      icon: UserPlus
    }
  }

  const btn = getButtonConfig()
  const ActionIcon = btn.icon

  return (
    <Card className="p-5 sm:p-6 rounded-2xl border-border/80 bg-card hover:border-border hover:shadow-md transition-all duration-200 group flex flex-col justify-between relative overflow-hidden w-full">
      
      {/* Decorative top accent block overlay */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="space-y-4">
        
        {/* Avatar + Member Details */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center font-extrabold text-base text-primary shrink-0 overflow-hidden shadow-inner relative">
            {user.profile_photo ? (
              <img src={user.profile_photo} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user.name?.charAt(0).toUpperCase() || '?'}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <Link href={`/profile/${user.id}`} className="block group/link truncate">
              <span className="text-sm sm:text-base font-extrabold text-foreground group-hover/link:text-primary transition-colors block truncate leading-tight">
                {user.name || 'Student Builder'}
              </span>
            </Link>

            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 truncate font-medium">
              <GraduationCap size={12} className="shrink-0 opacity-70" />
              <span className="truncate">{user.college || 'Student Builder'}</span>
            </div>

            {user.branch && user.year && (
              <p className="text-[10px] text-muted-foreground/80 mt-0.5 font-mono">
                {user.branch} <span className="opacity-60">•</span> Year {user.year}
              </p>
            )}
          </div>
        </div>

        {/* Bio text block */}
        {user.bio && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 font-normal bg-secondary/20 p-2.5 rounded-xl border border-border/40">
            {user.bio}
          </p>
        )}

        {/* Tech Skills stack pills */}
        {Array.isArray(user.skills) && user.skills.length > 0 && (
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">Tech Stack</span>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {user.skills.slice(0, 4).map(skill => (
                <span key={skill} className="px-2 py-0.5 rounded bg-secondary text-foreground border border-border/60 text-[10px] font-medium tracking-wide">
                  {skill}
                </span>
              ))}
              {user.skills.length > 4 && (
                <span className="text-[10px] text-muted-foreground self-center px-1 font-mono font-medium">
                  +{user.skills.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Needed Companion tags array */}
        {Array.isArray(user.looking_for) && user.looking_for.length > 0 && (
          <div className="space-y-1 pt-1">
            <span className="text-[9px] font-bold text-primary uppercase tracking-wider block font-mono">Looking For</span>
            <div className="flex flex-wrap gap-1">
              {user.looking_for.map(item => (
                <span key={item} className="px-2 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 text-[10px] font-medium font-mono">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Button Execution trigger row */}
      <div className="pt-4 mt-2 border-t border-border/40">
        <button
          onClick={() => {
            if (btn.disabled) return
            if (status === 'pending' && direction === 'received') onRespond(connectionInfo.connectionId)
            else onConnect(user.id)
          }}
          disabled={btn.disabled}
          className={cn(
            "w-full py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all duration-150 outline-none",
            btn.variantStyle
          )}
        >
          {ActionIcon && <ActionIcon size={13} className="shrink-0" />}
          <span>{btn.label}</span>
        </button>
      </div>

    </Card>
  )
}