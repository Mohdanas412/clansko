// app/(app)/projects/page.jsx
'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Briefcase, Sparkles, ChevronRight, Layers, Plus, Compass } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function ProjectsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await fetch('/api/posts')
      const json = await res.json()
      const myPosts = (json.data || []).filter(p => p.user_id === user.id)
      setPosts(myPosts)
      setLoading(false)
    }
    load()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
        <div className="space-y-2 pb-4 border-b border-border/60">
          <div className="w-32 h-3 rounded-full bg-secondary animate-pulse" />
          <div className="w-48 h-6 rounded-lg bg-secondary animate-pulse" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="w-full h-28 rounded-xl bg-secondary animate-pulse" />
          <div className="w-full h-28 rounded-xl bg-secondary animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-300">
      
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
            Projects
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your projects, review team requests, and keep track of your milestones.
          </p>
        </div>

        <Button 
          onClick={() => router.push('/feed')} 
          size="sm" 
          className="rounded-xl shadow-xs shrink-0 group h-10 px-4"
        >
          <Plus size={16} className="mr-1.5 group-hover:rotate-90 transition-transform duration-200" />
          <span className="font-semibold text-xs">Share Project / Idea</span>
        </Button>
      </div>

      {/* ── STREAMS / WORKSPACES ARRAY ── */}
      <div className="pt-6">
        {posts.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border/80 bg-secondary/10 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
              <Briefcase size={24} />
            </div>
            <p className="text-sm font-bold text-foreground">No Projects Shared Yet</p>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-normal">
              You haven&apos;t posted any projects or ideas to the community feed yet. Share what you&apos;re working on to find teammates and get feedback.
            </p>
            <Button size="sm" onClick={() => router.push('/feed')} className="mt-2 text-xs h-8">
              Share Project / Idea
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {posts.map((post, idx) => (
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
                  {/* Subtle top horizontal ambient highlight strip */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      
                      {/* Lifecycle Phase Badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono tracking-wide uppercase">
                        <Layers size={10} className="shrink-0" />
                        <span>Stage: {post.stage || 'Idea'}</span>
                      </span>

                      <h3 className="text-base sm:text-lg font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug truncate">
                        {post.title || 'Untitled Project'}
                      </h3>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 font-normal">
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