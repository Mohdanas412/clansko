'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Briefcase, ChevronRight, Layers, Plus, Bell, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function ProjectsPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const [myPosts, setMyPosts] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [joinedProjects, setJoinedProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      await fetchAll()
    }
    load()
  }, [])

  async function fetchAll() {
    try {
      setLoading(true)
      const res = await fetch('/api/projects/my')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setMyPosts(json.data.myPosts || [])
      setPendingInvites(json.data.pendingInvites || [])
      setJoinedProjects(json.data.joinedProjects || [])
    } catch (err) {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  async function respondToInvite(inviteId, action) {
    setResponding(inviteId + action)
    try {
      const res = await fetch('/api/projects/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: inviteId, action }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success(action === 'accepted' ? 'Joined the team! 🎉' : 'Invite declined')
      await fetchAll()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setResponding(null)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300 p-6">
        <div className="space-y-2 pb-4 border-b border-border/60">
          <div className="w-32 h-3 rounded-full bg-secondary animate-pulse" />
          <div className="w-48 h-6 rounded-lg bg-secondary animate-pulse" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="w-full h-28 rounded-xl bg-secondary animate-pulse" />
          <div className="w-full h-28 rounded-xl bg-secondary animate-pulse" />
          <div className="w-full h-28 rounded-xl bg-secondary animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-300 p-6">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-bold tracking-widest text-primary uppercase font-mono">
              MY PROJECTS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Your ideas & teams
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your posted ideas, pending invites, and teams you&apos;ve joined.
          </p>
        </div>
        <Button
          onClick={() => router.push('/feed')}
          size="sm"
          className="rounded-xl shadow-xs shrink-0 group h-10 px-4"
        >
          <Plus size={16} className="mr-1.5 group-hover:rotate-90 transition-transform duration-200" />
          <span className="font-semibold text-xs">Post Idea</span>
        </Button>
      </div>

      {/* ── PENDING INVITES ── */}
      {pendingInvites.length > 0 && (
        <div className="mt-8">
          <SectionLabel icon={<Bell size={13} />} label="Pending Invites" count={pendingInvites.length} />
          <div className="space-y-3">
            {pendingInvites.map((invite, idx) => (
              <motion.div
                key={invite.inviteId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.05 }}
              >
                <Card className="p-4 sm:p-5 border border-primary/30 bg-primary/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono tracking-wide uppercase">
                        <Layers size={10} className="shrink-0" />
                        {invite.project?.stage || 'idea'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        invited as <span className="font-semibold text-foreground">{invite.role}</span>
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-foreground truncate">
                      {invite.project?.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      by {invite.project?.author?.name || 'Unknown'}
                      {invite.project?.author?.college ? ` · ${invite.project.author.college}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => respondToInvite(invite.inviteId, 'accepted')}
                      disabled={!!responding}
                      className="h-8 px-4 text-xs font-bold rounded-lg"
                    >
                      {responding === invite.inviteId + 'accepted' ? 'Joining...' : 'Accept'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respondToInvite(invite.inviteId, 'declined')}
                      disabled={!!responding}
                      className="h-8 px-4 text-xs font-semibold rounded-lg"
                    >
                      {responding === invite.inviteId + 'declined' ? 'Declining...' : 'Decline'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── TEAMS I'VE JOINED ── */}
      {joinedProjects.length > 0 && (
        <div className="mt-8">
          <SectionLabel icon={<Users size={13} />} label="Teams I've Joined" count={joinedProjects.length} />
          <div className="space-y-3">
            {joinedProjects.map((item, idx) => (
              <motion.div
                key={item.membershipId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.05 }}
              >
                <Card
                  onClick={() => router.push(`/projects/${item.project?.id}`)}
                  className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card hover:border-border hover:bg-secondary/20 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono tracking-wide uppercase">
                        <Layers size={10} className="shrink-0" />
                        {item.project?.stage || 'idea'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        your role: <span className="font-semibold text-foreground">{item.role}</span>
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {item.project?.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      by {item.project?.author?.name || 'Unknown'}
                      {item.project?.author?.college ? ` · ${item.project.author.college}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-primary">
                    <span className="text-xs font-bold group-hover:underline">View</span>
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── MY IDEAS ── */}
      <div className="mt-8">
        <SectionLabel icon={<Briefcase size={13} />} label="My Ideas" count={myPosts.length} />

        {myPosts.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border/80 bg-secondary/10 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
              <Briefcase size={24} />
            </div>
            <p className="text-sm font-bold text-foreground">No Ideas Posted Yet</p>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Post your first idea on the feed to start building a team.
            </p>
            <Button size="sm" onClick={() => router.push('/feed')} className="mt-2 text-xs h-8">
              Go to Feed →
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myPosts.map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.03 }}
              >
                <Card
                  onClick={() => router.push(`/projects/${post.id}`)}
                  className="p-5 rounded-xl border border-border/80 bg-card hover:border-border hover:bg-secondary/20 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono tracking-wide uppercase">
                        <Layers size={10} className="shrink-0" />
                        Stage: {post.stage || 'Idea'}
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug truncate">
                        {post.title || 'Untitled Project'}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {post.description || 'No description provided.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                      <span className="text-xs font-bold text-primary group-hover:underline">
                        Manage Project
                      </span>
                      <ChevronRight size={14} className="text-primary group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ icon, label, count }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase font-mono">
        {label}
      </span>
      {count > 0 && (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
          {count}
        </span>
      )}
    </div>
  )
}