// app/(app)/messages/page.jsx
'use client';
 
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Search, ChevronRight, Clock } from 'lucide-react';
 
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MessageItemSkeleton } from '@/components/Skeleton';
 
export default function MessagesPage() {
  const router = useRouter();
 
  // ✅ supabase browser client — used ONLY for auth + own user data
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );
 
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
 
  useEffect(() => {
    async function init() {
      try {
        // ✅ SAFE — auth check always allowed on client
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }
 
        // ✅ SAFE — fetching own profile data after auth check
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
 
        if (userError) {
          console.error('Error fetching user:', userError);
          setLoading(false);
          return;
        }
 
        setCurrentUser(userData);
 
        // ✅ SECURE — all connections + messages data now fetched
        // via API route which verifies auth server-side before returning data.
        // Previously this was done with direct Supabase calls from the client,
        // allowing anyone with the anon key to read any user's messages.
        const response = await fetch('/api/conversations');
        const result = await response.json();
 
        if (!response.ok) {
          console.error('Error fetching conversations:', result.error);
          setLoading(false);
          return;
        }
 
        setConversations(result.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing messages page:', error);
        setLoading(false);
      }
    }
 
    init();
  }, [supabase, router]);
 
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
 
    if (days > 7) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };
 
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    return c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });
 
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
        <div className="space-y-2 pb-4 border-b border-border/60">
          <div className="w-32 h-3 rounded-full bg-secondary animate-pulse" />
          <div className="w-48 h-6 rounded-lg bg-secondary animate-pulse" />
        </div>
        <div className="space-y-2 pt-2">
          <MessageItemSkeleton />
          <MessageItemSkeleton />
          <MessageItemSkeleton />
          <MessageItemSkeleton />
        </div>
      </div>
    );
  }
 
  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-300">
 
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-bold tracking-widest text-primary uppercase font-mono">
              MESSAGES
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Messages
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Chat with your connections, share updates, and collaborate on projects.
          </p>
        </div>
 
        <Button
          onClick={() => router.push('/explore')}
          size="sm"
          className="rounded-xl shadow-xs shrink-0 group h-10 px-4"
        >
          <Plus size={16} className="mr-1.5 group-hover:rotate-90 transition-transform duration-200" />
          <span className="font-semibold text-xs">Explore Builders</span>
        </Button>
      </div>
 
      {/* ── SEARCH FILTER RIBBON ── */}
      {conversations.length > 0 && (
        <div className="relative pt-6 pb-4">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground mt-1"
          />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs sm:text-sm text-foreground outline-none focus:border-primary transition-all shadow-inner font-sans"
          />
        </div>
      )}
 
      {/* ── CONVERSATIONS STREAM ── */}
      <div className="pt-2">
        {conversations.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border/80 bg-secondary/10 flex flex-col items-center justify-center space-y-3 my-6">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
              <MessageSquare size={24} />
            </div>
            <p className="text-sm font-bold text-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-normal">
              You haven&apos;t started chatting with anyone yet. Connect with other builders on the
              Explore page to start a conversation.
            </p>
            <Button size="sm" onClick={() => router.push('/explore')} className="mt-2 text-xs h-8">
              Explore Builders
            </Button>
          </Card>
        ) : filteredConversations.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground italic border border-dashed rounded-xl bg-card/30">
            No conversations found for &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            {filteredConversations.map((conv, idx) => {
              const isUnread = conv.unreadCount > 0;
              return (
                <motion.div
                  key={conv.connectionId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: idx * 0.02 }}
                >
                  <Card
                    onClick={() => router.push(`/messages/${conv.connectionId}`)}
                    className={cn(
                      'p-3.5 sm:p-4 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden',
                      isUnread
                        ? 'bg-primary/5 border-primary/30 shadow-xs hover:border-primary'
                        : 'bg-card border-border/60 hover:border-border hover:bg-secondary/40 shadow-xs'
                    )}
                  >
                    {/* Unread indicator strip */}
                    {isUnread && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}
 
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center font-extrabold text-sm text-primary shrink-0 overflow-hidden shadow-inner relative">
                        {conv.otherUser?.profile_photo ? (
                          <img
                            src={conv.otherUser.profile_photo}
                            alt={conv.otherUser.name || ''}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerText =
                                conv.otherUser?.name?.charAt(0).toUpperCase() || '?';
                            }}
                          />
                        ) : (
                          <span>{conv.otherUser?.name?.charAt(0).toUpperCase() || '?'}</span>
                        )}
                      </div>
 
                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'text-xs sm:text-sm font-bold truncate transition-colors group-hover:text-primary',
                              isUnread ? 'text-foreground font-extrabold' : 'text-foreground'
                            )}
                          >
                            {conv.otherUser?.name || 'Student Builder'}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono font-medium shrink-0 flex items-center gap-1">
                            <Clock size={10} className="opacity-50" />
                            {formatTime(conv.timestamp)}
                          </span>
                        </div>
 
                        <div className="flex items-center justify-between gap-3">
                          <p
                            className={cn(
                              'text-xs truncate font-normal leading-relaxed',
                              isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'
                            )}
                          >
                            {conv.lastMessage?.content || 'Connected. Say hi to your new connection!'}
                          </p>
 
                          {isUnread ? (
                            <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold font-mono tracking-wide shrink-0">
                              {conv.unreadCount}
                            </span>
                          ) : (
                            <ChevronRight
                              size={14}
                              className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}