'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Flame, 
  Eye, 
  Handshake, 
  MessageSquare, 
  Plus, 
  Sparkles, 
  Layers, 
  Users, 
  Compass, 
  Send, 
  X, 
  CheckCircle2, 
  Target, 
  Cpu, 
  CornerDownRight,
  TrendingUp,
  Briefcase
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PostCardSkeleton } from '@/components/Skeleton'

const STAGE_OPTIONS = [
  { value: 'idea', label: 'Idea Pitch', colorClass: 'bg-secondary text-muted-foreground border-border' },
  { value: 'validation', label: 'Validating', colorClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { value: 'building', label: 'Building MVP', colorClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  { value: 'launched', label: 'Launched', colorClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
]

const LOOKING_FOR_OPTIONS = [
  'Co-founder', 'Developer', 'Designer', 'Marketer',
  'Feedback', 'Mentor', 'Investor'
]

const REACTIONS = [
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'eyes', emoji: '👀', label: 'Interested' },
  { type: 'handshake', emoji: '🤝', label: 'Collab' },
]

function timeAgo(dateString) {
  const now = new Date()
  const then = new Date(dateString)
  const seconds = Math.floor((now - then) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function FeedPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const router = useRouter()

  const [currentUser, setCurrentUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [postTeams, setPostTeams] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [expandedPost, setExpandedPost] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', stage: '', looking_for: [] })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState(null)

  // Filter state for beautiful navigation toggles
  const [selectedStageFilter, setSelectedStageFilter] = useState('all')

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUser(user)
      await fetchPosts()
    }
    init()
  }, [])

  async function fetchPosts() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/posts')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load posts')
      const fetchedPosts = json.data || []
      setPosts(fetchedPosts)

      // Fetch team members for all posts in parallel
      const teamResults = await Promise.all(
        fetchedPosts.map(p =>
          fetch(`/api/projects/${p.id}`)
            .then(r => r.json())
            .then(j => ({
              postId: p.id,
              members: (j.data?.members || []).filter(m => m.status === 'accepted'),
            }))
            .catch(() => ({ postId: p.id, members: [] }))
        )
      )
      const teamMap = {}
      teamResults.forEach(({ postId, members }) => { teamMap[postId] = members })
      setPostTeams(teamMap)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleLookingFor(value) {
    setForm(prev => ({
      ...prev,
      looking_for: prev.looking_for.includes(value)
        ? prev.looking_for.filter(v => v !== value)
        : [...prev.looking_for, value]
    }))
  }

  async function handleCreatePost() {
    if (!currentUser) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setFormError('You must be logged in.'); return }
      setCurrentUser(user)
    }
    if (!form.title.trim() || !form.description.trim() || !form.stage) {
      setFormError('Title, description, and stage are required.')
      return
    }
    try {
      setFormLoading(true)
      setFormError(null)
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          title: form.title.trim(),
          description: form.description.trim(),
          stage: form.stage,
          looking_for: form.looking_for,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create post')
      setForm({ title: '', description: '', stage: '', looking_for: [] })
      setShowModal(false)
      toast.success('Idea posted successfully! 🚀')
      await fetchPosts()
    } catch (err) {
      setFormError(err.message)
      toast.error('Failed to post. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleReact(postId, type) {
    if (!currentUser) return
    try {
      const res = await fetch('/api/posts/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, postId, type }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post
        const oldReactions = { ...post.reactions }
        const oldUserReaction = post.reactions_by_user?.[currentUser.id]
        if (oldUserReaction) {
          oldReactions[oldUserReaction] = Math.max(0, (oldReactions[oldUserReaction] || 1) - 1)
        }
        const newUserReaction = json.data.action === 'removed' ? null : type
        if (newUserReaction) {
          oldReactions[newUserReaction] = (oldReactions[newUserReaction] || 0) + 1
        }
        return {
          ...post,
          reactions: oldReactions,
          reactions_by_user: { ...post.reactions_by_user, [currentUser.id]: newUserReaction },
        }
      }))
    } catch (err) {
      toast.error('Failed to react. Try again.')
    }
  }

  const filteredPosts = posts.filter(p => {
    if (selectedStageFilter === 'all') return true
    return p.stage === selectedStageFilter
  })

  return (
    <div className="w-full animate-in fade-in duration-300">
      
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-bold tracking-widest text-primary uppercase font-mono">
              LIVE FEED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Builder Feed
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Check out what students are building, give genuine feedback, and team up.
          </p>
        </div>

        <Button 
          onClick={() => setShowModal(true)} 
          size="lg" 
          className="rounded-xl shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 h-11 px-5 shrink-0 group"
        >
          <Plus size={18} className="mr-1.5 group-hover:rotate-90 transition-transform duration-200" />
          <span className="font-semibold text-sm">Share Project / Idea</span>
        </Button>
      </div>

      {/* ── TWO-COLUMN DASHBOARD GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
        
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick filter tabs row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedStageFilter('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 border",
                selectedStageFilter === 'all'
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border/80 hover:bg-secondary hover:text-foreground"
              )}
            >
              All Stages ({posts.length})
            </button>
            {STAGE_OPTIONS.map(opt => {
              const count = posts.filter(p => p.stage === opt.value).length
              const isActive = selectedStageFilter === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setSelectedStageFilter(opt.value)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 border",
                    isActive
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "bg-card text-muted-foreground border-border/80 hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {opt.label.split(' ')[0]} ({count})
                </button>
              )
            })}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              <PostCardSkeleton />
              <PostCardSkeleton />
              <PostCardSkeleton />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card className="p-6 border-red-200 bg-red-50/50 text-red-800 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <X size={18} className="text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              <Button variant="outline" size="sm" onClick={fetchPosts} className="border-red-200 text-red-700 hover:bg-red-100/50">
                Retry Fetch
              </Button>
            </Card>
          )}

          {/* Empty State */}
          {!loading && !error && filteredPosts.length === 0 && (
            <Card className="p-12 text-center border-dashed border-border/80 bg-secondary/10 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                <Layers size={24} />
              </div>
              <p className="text-sm font-bold text-foreground">No updates found</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {selectedStageFilter === 'all' 
                  ? "The feed is quiet right now. Be the first to share what you're working on!"
                  : `No projects currently marked under the "${selectedStageFilter}" stage.`}
              </p>
              {selectedStageFilter !== 'all' && (
                <Button variant="link" size="sm" onClick={() => setSelectedStageFilter('all')} className="text-xs">
                  Clear Stage Filters
                </Button>
              )}
            </Card>
          )}

          {/* Render Feed Cards Stream */}
          {!loading && filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <PostCard
                post={post}
                currentUserId={currentUser?.id}
                onReact={handleReact}
                onExpand={() => setExpandedPost(post)}
                teamMembers={postTeams[post.id] || []}
                router={router}
              />
            </motion.div>
          ))}
        </div>

        {/* ── SIDEBAR COMMUNITY ENERGY PANEL (Desktop Only) ── */}
        <div className="hidden lg:block lg:col-span-4 space-y-6 shrink-0">
          
          {/* Active Builder Community Summary Widget */}
          <Card className="p-5 rounded-2xl border-border/80 bg-card/60 backdrop-blur-md space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Community Vibe</span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Live Sync
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/40">
                <p className="text-xs text-muted-foreground font-medium">Active Builders</p>
                <p className="text-xl font-extrabold text-foreground mt-0.5">1,420+</p>
                <p className="text-[9px] text-emerald-600 font-medium mt-1">↑ 12% this week</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/50 border border-border/40">
                <p className="text-xs text-muted-foreground font-medium">Active Projects</p>
                <p className="text-xl font-extrabold text-primary mt-0.5">312</p>
                <p className="text-[9px] text-muted-foreground font-medium mt-1">Across 42 Campuses</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Top Builder Campuses</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between px-2 py-1 rounded bg-secondary/30">
                  <span className="font-medium text-foreground">IIT Roorkee</span>
                  <span className="text-[11px] font-bold text-primary">42 projects</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded bg-secondary/30">
                  <span className="font-medium text-foreground">DTU Delhi</span>
                  <span className="text-[11px] font-bold text-muted-foreground">38 projects</span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 rounded bg-secondary/30">
                  <span className="font-medium text-foreground">BITS Pilani</span>
                  <span className="text-[11px] font-bold text-muted-foreground">29 projects</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Micro-Accountability Status Frame */}
          <Card className="p-5 rounded-2xl border-border/80 bg-gradient-to-br from-card to-secondary/30 space-y-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-primary" />
              <span className="text-xs font-bold text-foreground">Weekly Goals</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Share weekly updates to hold yourself accountable and build streaks with your friends.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/goals')}
              className="w-full text-xs h-9 justify-between rounded-xl bg-background border-border/80"
            >
              <span>View My Tracker</span>
              <CornerDownRight size={14} className="text-muted-foreground" />
            </Button>
          </Card>

          {/* Pro-Tips Callout Widget */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-primary">
              <Sparkles size={13} />
              <span>SaaS Duo Tip</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
              Adding specific &apos;Looking For&apos; tags helps you find co-founders and team members way faster.
            </p>
          </div>

        </div>

      </div>

      {/* ── CREATE POST MODAL ── */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setFormError(null) }}>
          <div className="space-y-4">
            
            <div className="pb-3 border-b border-border/60 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground leading-none">Share what you&apos;re building</h2>
                <p className="text-xs text-muted-foreground mt-1">Pitch an idea, share a milestone, or ask for feedback from the community.</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowModal(false)}>
                <X size={16} />
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Title *</label>
              <input
                placeholder="e.g. AI-powered revision tool for engineering students"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full rounded-xl bg-secondary/50 border border-border px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-background transition-all"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description *</label>
              <textarea
                placeholder="What are you building? What stack are you using? Need help with anything? Keep it simple."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full rounded-xl bg-secondary/50 border border-border px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-background transition-all h-28 resize-none"
                maxLength={1000}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Stage *</label>
              <div className="grid grid-cols-2 gap-2">
                {STAGE_OPTIONS.map(opt => {
                  const isSelected = form.stage === opt.value
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setForm(p => ({ ...p, stage: opt.value }))}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between h-14",
                        isSelected 
                          ? "bg-primary/5 border-primary text-primary font-semibold shadow-sm" 
                          : "bg-background border-border/80 text-muted-foreground hover:bg-secondary/60"
                      )}
                    >
                      <span className="text-xs leading-none">{opt.label}</span>
                      <span className="text-[9px] opacity-70">Select Stage</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Looking For Companions <span className="text-muted-foreground/60 font-normal">(Optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {LOOKING_FOR_OPTIONS.map(opt => {
                  const isSelected = form.looking_for.includes(opt)
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => toggleLookingFor(opt)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[11px] font-medium transition-all border",
                        isSelected 
                          ? "bg-primary text-white border-primary shadow-sm" 
                          : "bg-secondary text-muted-foreground border-border/60 hover:border-border"
                      )}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-100">
                {formError}
              </div>
            )}

            <div className="pt-2 border-t border-border/60">
              <Button
                onClick={handleCreatePost}
                disabled={formLoading}
                className="w-full rounded-xl h-11 text-xs font-bold"
              >
                {formLoading ? 'Posting...' : 'Share with Community'}
              </Button>
            </div>

          </div>
        </Modal>
      )}

      {/* ── EXPANDED POST INTERACTIVE OVERLAY ── */}
      {expandedPost && (
        <ExpandedPost
          post={expandedPost}
          currentUser={currentUser}
          onClose={() => setExpandedPost(null)}
          onReact={handleReact}
          onCommentAdded={(postId) => {
            setPosts(prev => prev.map(p =>
              p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p
            ))
          }}
        />
      )}

    </div>
  )
}

// ── MODERNIZED PREMIUM FEED CARD COMPONENT ─────────────────────────────────────
function PostCard({ post, currentUserId, onReact, onExpand, teamMembers, router }) {
  const userReaction = post.reactions_by_user?.[currentUserId]
  const isOwner = post.user_id === currentUserId

  // Retrieve Stage matching config
  const stageObj = STAGE_OPTIONS.find(s => s.value === post.stage) || STAGE_OPTIONS[0]

  return (
    <Card className="p-5 sm:p-6 rounded-2xl border-border/80 bg-card hover:border-border hover:shadow-md transition-all duration-200 group flex flex-col justify-between relative overflow-hidden">
      
      {/* Decorative Stage highlight corner string */}
      <div className="absolute top-0 right-0 w-20 h-1 bg-gradient-to-l from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Creator Identity Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary border border-border/80 flex items-center justify-center font-bold text-xs text-primary shrink-0 overflow-hidden shadow-inner relative">
              {post.users?.profile_photo ? (
                <img src={post.users.profile_photo} alt={post.users.name} className="w-full h-full object-cover" />
              ) : (
                <span>{post.users?.name?.charAt(0).toUpperCase() || '?'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-foreground leading-none hover:text-primary transition-colors cursor-pointer">
                  {post.users?.name || 'Anonymous Student'}
                </span>
                {isOwner && (
                  <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-medium">You</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                {post.users?.college || 'Student Builder'} <span className="opacity-60">•</span> {timeAgo(post.created_at)}
              </p>
            </div>
          </div>

          {/* Dynamic Stage Pill */}
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide border uppercase shrink-0 font-mono",
            stageObj.colorClass
          )}>
            {post.stage}
          </span>
        </div>

        {/* Blueprint Title */}
        <h3
          onClick={onExpand}
          className="text-base sm:text-lg font-bold text-foreground leading-snug mb-2 hover:text-primary transition-colors cursor-pointer"
        >
          {post.title}
        </h3>

        {/* Thesis Description Preview */}
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3 font-normal">
          {post.description}
        </p>

        {/* Looking For Framework Tags */}
        {post.looking_for?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mr-1">Looking for:</span>
            {post.looking_for.map(item => (
              <span key={item} className="px-2 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 text-[10px] font-medium tracking-wide font-mono">
                {item}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        {/* Core Collaboration Trio row */}
        {(teamMembers.length > 0 || isOwner) && (
          <div className="flex items-center justify-between py-3 mb-3 border-y border-border/40 gap-3 flex-wrap bg-secondary/20 -mx-5 px-5 sm:-mx-6 sm:px-6">
            <div className="flex items-center gap-2.5">
              {teamMembers.length > 0 ? (
                <>
                  <div className="flex items-center">
                    {teamMembers.slice(0, 4).map((m, i) => (
                      <div
                        key={m.id}
                        title={m.profile?.name}
                        className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden relative -ml-2 first:ml-0 shadow-sm"
                      >
                        {m.profile?.profile_photo ? (
                          <img src={m.profile.profile_photo} alt={m.profile.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{m.profile?.name?.charAt(0).toUpperCase() || '?'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => router.push(`/projects/${post.id}`)}
                    className="text-[11px] text-primary font-semibold hover:underline"
                  >
                    View Project →
                  </button>
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground italic">Looking for team members</span>
              )}
            </div>

            {isOwner && (
              <button
                onClick={() => router.push(`/projects/${post.id}`)}
                className="text-[11px] font-bold text-primary border border-border/80 bg-background px-2.5 py-1 rounded-lg hover:border-primary/40 transition-colors"
              >
                + Add Team
              </button>
            )}
          </div>
        )}

        {/* Interactive Engagement Counters row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {REACTIONS.map(r => {
              const count = post.reactions?.[r.type] || 0
              const isReacted = userReaction === r.type
              return (
                <button
                  key={r.type}
                  onClick={(e) => { e.stopPropagation(); onReact(post.id, r.type) }}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
                    isReacted
                      ? "bg-primary/10 border-primary text-primary font-bold scale-[1.02]"
                      : "bg-secondary/40 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  title={r.label}
                >
                  <span>{r.emoji}</span>
                  <span className="text-[11px]">{count}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={onExpand}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary/40 border border-transparent text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <MessageSquare size={14} className="opacity-70" />
            <span className="text-[11px] font-bold">{post.comment_count || 0}</span>
          </button>
        </div>
      </div>

    </Card>
  )
}

// ── CUSTOM MODAL WRAPPER ───────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl shadow-black/5 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200"
      >
        {children}
      </div>
    </div>
  )
}

// ── EXPANDED POST COMMENTARY INTERACTION ROW MODULE ────────────────────────────
function ExpandedPost({ post, currentUser, onClose, onReact, onCommentAdded }) {
  const [fullPost, setFullPost] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [comment, setComment] = React.useState('')
  const [commentLoading, setCommentLoading] = React.useState(false)
  const [commentError, setCommentError] = React.useState(null)

  const userReaction = (fullPost || post).reactions_by_user?.[currentUser?.id]
  const displayPost = fullPost || post
  const stageObj = STAGE_OPTIONS.find(s => s.value === displayPost.stage) || STAGE_OPTIONS[0]

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/posts/${post.id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load post')
        setFullPost(json.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [post.id])

  async function handleComment() {
    if (!comment.trim()) return
    try {
      setCommentLoading(true)
      setCommentError(null)
      const res = await fetch('/api/posts/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, postId: post.id, content: comment.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to post comment')
      setFullPost(prev => ({ ...prev, comments: [...(prev.comments || []), json.data] }))
      setComment('')
      onCommentAdded(post.id)
      toast.success('Comment added successfully!')
    } catch (err) {
      setCommentError(err.message)
      toast.error('Failed to post comment.')
    } finally {
      setCommentLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="space-y-4">
        
        {/* Dynamic header stage indicator */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border font-mono uppercase",
            stageObj.colorClass
          )}>
            {displayPost.stage} Stage
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>

        {/* Main Post Header block */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug mb-3">
            {displayPost.title}
          </h2>

          <div className="flex items-center gap-3 bg-secondary/30 p-2.5 rounded-xl border border-border/40">
            <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center font-bold text-xs text-primary overflow-hidden">
              {displayPost.users?.profile_photo ? (
                <img src={displayPost.users.profile_photo} alt={displayPost.users.name} className="w-full h-full object-cover" />
              ) : (
                <span>{displayPost.users?.name?.charAt(0).toUpperCase() || '?'}</span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-none">
                {displayPost.users?.name || 'Anonymous Peer'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                {displayPost.users?.college || 'Campus Engineer'} • {timeAgo(displayPost.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Logic paragraph */}
        <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal bg-secondary/10 p-4 rounded-xl border border-border/40">
          {displayPost.description}
        </p>

        {/* Looking For framework tags */}
        {displayPost.looking_for?.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Looking for:</span>
            <div className="flex flex-wrap gap-1.5">
              {displayPost.looking_for.map(item => (
                <span key={item} className="px-2 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 text-[10px] font-medium font-mono">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Linear Reaction Matrix */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          {REACTIONS.map(r => {
            const count = displayPost.reactions?.[r.type] || 0
            const isReacted = userReaction === r.type
            return (
              <button
                key={r.type}
                onClick={() => onReact(displayPost.id, r.type)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                  isReacted
                    ? "bg-primary/10 border-primary text-primary font-bold"
                    : "bg-secondary/40 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <span>{r.emoji}</span>
                <span className="text-xs">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Commentary Stream */}
        <div className="space-y-3 pt-4 border-t border-border/60">
          <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase font-mono">
            Comments ({loading ? '...' : displayPost.comments?.length || 0})
          </p>

          {loading && (
            <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
              Loading comments...
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-100">
              {error}
            </div>
          )}

          {!loading && displayPost.comments?.map(c => (
            <div key={c.id} className="flex gap-2.5 items-start p-3 rounded-xl bg-secondary/30 border border-border/40">
              <div className="w-6 h-6 rounded-md bg-background border border-border/80 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                {c.users?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground leading-none">
                    {c.users?.name || 'Student Builder'}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-medium font-mono">
                    {timeAgo(c.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed font-normal">
                  {c.content}
                </p>
              </div>
            </div>
          ))}

          {!loading && displayPost.comments?.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground/80 bg-secondary/10 rounded-xl border border-dashed border-border/60 italic">
              No comments yet. Be the first to share feedback or ask a question!
            </div>
          )}
        </div>

        {/* Append commentary input row */}
        <div className="space-y-2 pt-2">
          <textarea
            placeholder="Share your thoughts, ask about their stack, or offer to help..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="w-full rounded-xl bg-secondary/40 border border-border px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:bg-background transition-all h-20 resize-none"
            maxLength={500}
          />
          {commentError && (
            <p className="text-red-600 text-xs">{commentError}</p>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleComment}
              disabled={commentLoading || !comment.trim()}
              size="sm"
              className="rounded-xl px-4 h-9 text-xs font-bold"
            >
              <Send size={12} className="mr-1.5" />
              <span>{commentLoading ? 'Posting...' : 'Add Comment'}</span>
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  )
}