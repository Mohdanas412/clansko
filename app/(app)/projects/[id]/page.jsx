// app/(app)/projects/[id]/page.jsx
'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, 
  Sparkles, 
  Users, 
  UserPlus, 
  Check, 
  X, 
  ArrowLeft, 
  Layers, 
  GraduationCap, 
  ShieldCheck, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function ProjectPage({ params }) {
  const { id } = params
  const router = useRouter()

  const [project, setProject] = useState(null)
  const [author, setAuthor] = useState(null)
  const [members, setMembers] = useState([])
  const [isOwner, setIsOwner] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Invite overlay management mapping
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [connections, setConnections] = useState([])
  const [connectionsLoading, setConnectionsLoading] = useState(false)
  const [inviting, setInviting] = useState(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    fetchProject()
  }, [id])

  async function fetchProject() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/projects/${id}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to load project details')
        return
      }
      setProject(json.data.project)
      setAuthor(json.data.author)
      setMembers(json.data.members || [])
      setIsOwner(json.data.isOwner)
      setCurrentUserId(json.data.currentUserId)
    } catch (err) {
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  async function openInviteModal() {
    setShowInviteModal(true)
    setConnectionsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch(`/api/connections?userId=${user.id}`)
      const json = await res.json()
      if (!res.ok) throw new Error()

      const teamUserIds = members.map(m => m.user_id)

      const eligible = (json.data || [])
        .filter(c => c.status === 'accepted' && !teamUserIds.includes(c.otherUser?.id))
        .map(c => c.otherUser)

      setConnections(eligible)
    } catch {
      toast.error('Could not load connections')
    } finally {
      setConnectionsLoading(false)
    }
  }

  async function invitePerson(userId) {
    setInviting(userId)
    try {
      const res = await fetch('/api/projects/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id, user_id: userId }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to send invite')
        return
      }
      toast.success('Invite sent successfully!')
      setShowInviteModal(false)
      fetchProject()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setInviting(null)
    }
  }

  async function respondToInvite(inviteId, action) {
    try {
      const res = await fetch('/api/projects/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: inviteId, action }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to respond to invite')
        return
      }
      toast.success(action === 'accepted' ? 'Welcome to the team!' : 'Invite declined')
      fetchProject()
    } catch {
      toast.error('Network error')
    }
  }

  const acceptedMembers = members.filter(m => m.status === 'accepted')
  const pendingMembers = members.filter(m => m.status === 'pending')
  const myInvite = members.find(
    m => m.user_id === currentUserId && m.status === 'pending'
  )

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="w-24 h-8 rounded-lg bg-secondary animate-pulse" />
        <div className="w-full h-48 rounded-2xl bg-secondary animate-pulse" />
        <div className="w-full h-32 rounded-xl bg-secondary animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 border-red-200 bg-red-50/50 text-red-800 text-center max-w-md mx-auto space-y-3">
        <p className="font-bold text-sm">{error}</p>
        <Button size="sm" onClick={() => router.push('/feed')} className="h-8 text-xs">
          Back to Feed
        </Button>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto animate-in fade-in duration-300 space-y-6">
      
      {/* ── CORE NAVIGATION ROW ── */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/projects')}
          className="rounded-xl text-xs text-muted-foreground hover:text-foreground h-8 px-3 -ml-2"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          <span>My Projects</span>
        </Button>

        <span className="text-[10px] font-bold text-muted-foreground font-mono tracking-wider uppercase">
          PROJECT SPACE
        </span>
      </div>

      {/* ── PENDING INVITATION ACTION ACCENT BANNER ── */}
      {myInvite && (
        <Card className="p-4 sm:p-5 rounded-2xl bg-primary/5 border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest text-primary uppercase block font-mono">
              Team Invite
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-foreground leading-tight">
              You&apos;ve been invited to join this project team.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => respondToInvite(myInvite.id, 'accepted')}
              className="h-8 px-3.5 text-xs rounded-xl shadow-xs"
            >
              <CheckCircle2 size={13} className="mr-1" />
              <span>Accept Invite</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => respondToInvite(myInvite.id, 'declined')}
              className="h-8 px-3 text-xs rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              Decline
            </Button>
          </div>
        </Card>
      )}

      {/* ── PRIMARY BLUEPRINT WORKSPACE HERO CARD ── */}
      <Card className="p-6 sm:p-8 rounded-3xl border-border bg-card shadow-sm space-y-4 relative overflow-hidden">
        {/* Subtle orange accent graphic gradient layer */}
        <div className="absolute right-0 top-0 w-72 h-72 rounded-full bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="flex items-center justify-between gap-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-bold font-mono tracking-wide uppercase">
            <Layers size={12} className="shrink-0" />
            <span>Stage: {project.stage || 'Idea'}</span>
          </span>

          <span className="text-[10px] text-muted-foreground font-mono font-medium">
            Project Details
          </span>
        </div>

        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-snug">
            {project.title}
          </h1>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-normal bg-secondary/30 p-3.5 rounded-2xl border border-border/40">
            {project.description}
          </p>
        </div>

        {/* Roles Needed Parameters */}
        {project.looking_for && (
          <div className="space-y-1.5 pt-2 border-t border-border/60 relative z-10">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">
              Looking For
            </span>
            <div className="flex flex-wrap gap-1">
              {(Array.isArray(project.looking_for) ? project.looking_for : [project.looking_for]).map((role, idx) => (
                <span key={idx} className="px-2.5 py-0.5 rounded bg-secondary text-foreground text-[10px] font-medium border border-border/60 tracking-wide">
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── AUTHOR FOUNDER MODULE ── */}
      {author && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block font-mono px-1">
            Creator
          </span>

          <Card
            onClick={() => router.push(`/profile/${author.id}`)}
            className="p-4 sm:p-5 rounded-2xl border-border/80 bg-card hover:border-border hover:bg-secondary/20 transition-all cursor-pointer flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center font-extrabold text-sm text-primary shrink-0 overflow-hidden shadow-inner relative">
                {author.profile_photo ? (
                  <img src={author.profile_photo} alt={author.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{author.name?.charAt(0).toUpperCase() || '?'}</span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {author.name || 'Student Builder'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[9px] font-mono font-bold tracking-wide uppercase shrink-0">
                    Creator
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 truncate font-medium">
                  <GraduationCap size={12} className="shrink-0 opacity-60" />
                  <span className="truncate">{author.college || 'Student Builder'}</span>
                </div>

                {author.branch && author.year && (
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5 font-mono">
                    {author.branch} <span className="opacity-60">•</span> Year {author.year}
                  </p>
                )}
              </div>
            </div>

            <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform shrink-0 hidden sm:inline-block">
              View Profile →
            </span>
          </Card>
        </div>
      )}

      {/* ── COLLABORATION SQUAD MATRIX ── */}
      <Card className="p-6 rounded-2xl border-border bg-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="space-y-0.5">
            <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              <Users size={15} className="text-primary" />
              <span>Team Members</span>
            </h2>
            <p className="text-[11px] text-muted-foreground leading-none">
              People building this project together.
            </p>
          </div>

          {isOwner && (
            <Button
              onClick={openInviteModal}
              size="sm"
              className="h-8 px-3 rounded-xl text-xs shadow-xs shrink-0 self-start sm:self-auto"
            >
              <UserPlus size={13} className="mr-1.5" />
              <span>+ Invite Teammate</span>
            </Button>
          )}
        </div>

        {/* Accepted Builders Array */}
        <div className="space-y-2 pt-1">
          {acceptedMembers.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-4 bg-secondary/10 rounded-xl border border-dashed border-border/80">
              No other team members yet. Invite your friends or connections to build together.
            </p>
          ) : (
            acceptedMembers.map(m => (
              <MemberRow
                key={m.id}
                member={m}
                onProfileClick={() => router.push(`/profile/${m.user_id}`)}
              />
            ))
          )}
        </div>

        {/* Pending Builders Loop */}
        {isOwner && pendingMembers.length > 0 && (
          <div className="pt-4 border-t border-border/60 space-y-2">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block font-mono">
              Pending Invites
            </span>
            <div className="space-y-2">
              {pendingMembers.map(m => (
                <MemberRow key={m.id} member={m} pending />
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── INVITATION MANAGER OVERLAY DIALOGUE ── */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.25 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5 border-b border-border bg-background/50 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Invite to Team</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Invite people you are connected with</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowInviteModal(false)} className="h-8 w-8 rounded-lg">
                  <X size={14} />
                </Button>
              </div>

              <div className="p-4 sm:p-5 flex-1 overflow-y-auto custom-scrollbar space-y-2">
                {connectionsLoading ? (
                  <div className="space-y-2">
                    <div className="h-12 rounded-xl bg-secondary animate-pulse" />
                    <div className="h-12 rounded-xl bg-secondary animate-pulse" />
                    <div className="h-12 rounded-xl bg-secondary animate-pulse" />
                  </div>
                ) : connections.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                    <HelpCircle size={20} className="mx-auto text-muted-foreground/60" />
                    <p>No eligible connection targets matched.</p>
                    <p className="text-[11px] text-muted-foreground/80">
                      Connect with other builders on the Explore page first to invite them to your team.
                    </p>
                  </div>
                ) : (
                  connections.map(c => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl border border-border bg-background flex items-center justify-between gap-3 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center font-bold text-xs text-primary shrink-0 overflow-hidden shadow-xs">
                          {c.profile_photo ? (
                            <img src={c.profile_photo} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{c.name?.charAt(0).toUpperCase() || '?'}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{c.name || 'Anonymous User'}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{c.college || 'Student Builder'}</p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => invitePerson(c.id)}
                        disabled={inviting === c.id}
                        className="h-7 px-3 rounded-lg text-xs tracking-wide shrink-0"
                      >
                        <span>{inviting === c.id ? '...' : 'Invite'}</span>
                      </Button>
                    </div>
                  ))
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

// ── COMPONENTIZED MEMBER ROW LAYERS ──────────────────────────────────────────
function MemberRow({ member, pending = false, onProfileClick }) {
  const p = member.profile
  if (!p) return null

  return (
    <div
      onClick={onProfileClick}
      className={cn(
        "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all duration-150",
        pending 
          ? "bg-secondary/10 border-dashed border-border/80 opacity-70 cursor-default" 
          : "bg-secondary/20 border-border/60 hover:border-border hover:bg-secondary/40 cursor-pointer group"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-background border border-border flex items-center justify-center font-bold text-xs text-primary shrink-0 overflow-hidden shadow-xs">
          {p.profile_photo ? (
            <img src={p.profile_photo} alt={p.name} className="w-full h-full object-cover" />
          ) : (
            <span>{p.name?.charAt(0).toUpperCase() || '?'}</span>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
            {p.name || 'Student Builder'}
          </p>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            {p.college || 'Student Builder'} <span className="opacity-60">•</span> {member.role || 'Member'}
          </p>
        </div>
      </div>

      {pending ? (
        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-mono font-bold tracking-wide uppercase shrink-0">
          Pending
        </span>
      ) : (
        <ShieldCheck size={14} className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 hidden sm:inline-block" />
      )}
    </div>
  )
}