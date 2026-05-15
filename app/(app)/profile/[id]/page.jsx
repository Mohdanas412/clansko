// app/(app)/profile/[id]/page.jsx
'use client';
 
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  GraduationCap, 
  UserPlus, 
  CheckCircle2, 
  MessageCircle, 
  FileText, 
  Award,
  Send,
  User
} from 'lucide-react';
 
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
 
export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id;
 
  // ✅ SAFE — browser client used only for auth check below
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );
 
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [pendingConnectionId, setPendingConnectionId] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [connectLoading, setConnectLoading] = useState(false);
 
  useEffect(() => {
    async function init() {
      // ✅ SAFE — auth check on client is fine
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
 
      // ✅ SECURE — fetch own user data via API route (already existed)
      const currentUserRes = await fetch(`/api/users/${user.id}`);
      const currentUserJson = await currentUserRes.json();
      if (currentUserRes.ok) {
        setCurrentUser(currentUserJson.data);
      }
 
      // ✅ FIX: Was a direct supabase.from('users') call — anyone could scrape
      // all profiles. Now goes through the API route which verifies auth first.
      const profileRes = await fetch(`/api/users/${profileId}`);
      const profileJson = await profileRes.json();
 
      if (!profileRes.ok || !profileJson.data) {
        toast.error('User profile not found');
        router.push('/explore');
        return;
      }
 
      setProfileUser(profileJson.data);
 
      // ✅ FIX: Was a direct supabase.from('posts') call.
      // Now uses the API route with ?user_id= filter (added to route.js).
      const postsRes = await fetch(`/api/posts?user_id=${profileId}`);
      const postsJson = await postsRes.json();
      if (postsRes.ok) {
        setUserPosts(postsJson.data || []);
      }
 
      // ✅ FIX: Was a direct supabase.from('connections') call — anyone could
      // check connection status between any two users.
      // New dedicated API route extracts the viewer's ID from the auth session.
      if (user.id !== profileId) {
        const statusRes = await fetch(`/api/connections/status?profile_id=${profileId}`);
        const statusJson = await statusRes.json();
 
        if (statusRes.ok && statusJson.data) {
          const { status, connectionId } = statusJson.data;
          setConnectionStatus(status);
          setPendingConnectionId(connectionId);
        }
      }
 
      setLoading(false);
    }
 
    init();
  }, [profileId, supabase, router]);
 
  // ✅ Already secure — uses API route
  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: profileId,
          message: `Hi ${profileUser?.name || 'there'}, let's connect and build together!`
        })
      });
 
      if (response.ok) {
        setConnectionStatus('pending');
        toast.success('Connection request sent!');
      } else {
        toast.error('Failed to send connection request');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
    setConnectLoading(false);
  };
 
  // ✅ Already secure — uses API route
  const handleAccept = async () => {
    setConnectLoading(true);
    try {
      const response = await fetch('/api/connections/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: pendingConnectionId,
          action: 'accept'
        })
      });
 
      if (response.ok) {
        setConnectionStatus('accepted');
        toast.success('Connection request accepted!');
      } else {
        toast.error('Failed to accept request');
      }
    } catch (error) {
      toast.error('Error accepting connection request');
    }
    setConnectLoading(false);
  };
 
  const handleMessage = () => {
    router.push(`/messages/${pendingConnectionId}`);
  };
 
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="w-full h-56 rounded-3xl bg-secondary animate-pulse" />
        <div className="flex gap-4">
          <div className="w-32 h-10 rounded-xl bg-secondary animate-pulse" />
          <div className="w-32 h-10 rounded-xl bg-secondary animate-pulse" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="w-full h-40 rounded-2xl bg-secondary animate-pulse" />
          <div className="w-full h-40 rounded-2xl bg-secondary animate-pulse" />
        </div>
      </div>
    );
  }
 
  const isOwnProfile = currentUser?.id === profileId;
  const reactionCount = userPosts.reduce((sum, post) => sum + (post.reactions?.length || 0), 0);
  const commentCount = userPosts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);
 
  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-300 space-y-6">
      
      {/* ── PROFILE HERO CARD ── */}
      <Card className="p-6 sm:p-8 rounded-3xl border-border bg-card shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-gradient-to-bl from-primary/10 via-transparent to-transparent pointer-events-none" />
 
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between relative z-10">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center min-w-0 flex-1">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-secondary border border-border flex items-center justify-center font-extrabold text-2xl text-primary shrink-0 overflow-hidden shadow-inner relative">
              {profileUser.profile_photo ? (
                <img 
                  src={profileUser.profile_photo} 
                  alt={profileUser.name || ''}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                <span>{profileUser.name?.charAt(0).toUpperCase() || '?'}</span>
              )}
              <span className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-card" />
            </div>
 
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight truncate">
                  {profileUser.name}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono tracking-wide uppercase shrink-0">
                  {isOwnProfile ? 'You' : 'Student Builder'}
                </span>
              </div>
 
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground font-medium">
                {profileUser.college && (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap size={13} className="text-primary/70 shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-xs">{profileUser.college}</span>
                  </span>
                )}
                {profileUser.branch && (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="truncate">{profileUser.branch}</span>
                  </>
                )}
                {profileUser.year && (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="font-mono">Year {profileUser.year}</span>
                  </>
                )}
              </div>
 
              {profileUser.bio && (
                <p className="text-xs sm:text-sm text-muted-foreground/90 leading-relaxed font-normal pt-0.5 max-w-xl">
                  {profileUser.bio}
                </p>
              )}
            </div>
          </div>
 
          <div className="flex flex-row sm:flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t border-border/40 sm:border-none">
            {isOwnProfile ? (
              <Button
                onClick={() => router.push('/profile/edit')}
                size="sm"
                className="w-full sm:w-auto rounded-xl text-xs h-9 shadow-xs px-4"
              >
                <span>Edit Profile</span>
              </Button>
            ) : (
              <>
                {connectionStatus === 'accepted' ? (
                  <Button onClick={handleMessage} size="sm" className="w-full sm:w-auto rounded-xl text-xs h-9 shadow-xs px-4">
                    <MessageSquare size={13} className="mr-1.5" />
                    <span>Message</span>
                  </Button>
                ) : connectionStatus === 'pending' ? (
                  <>
                    {pendingConnectionId ? (
                      <Button onClick={handleAccept} disabled={connectLoading} size="sm" className="w-full sm:w-auto rounded-xl text-xs h-9 shadow-xs px-4">
                        <CheckCircle2 size={13} className="mr-1.5" />
                        <span>{connectLoading ? '...' : 'Accept Request'}</span>
                      </Button>
                    ) : (
                      <Button disabled variant="outline" size="sm" className="w-full sm:w-auto rounded-xl text-xs h-9 cursor-not-allowed opacity-50 px-4">
                        <span>Request Sent</span>
                      </Button>
                    )}
                  </>
                ) : (
                  <Button onClick={handleConnect} disabled={connectLoading} size="sm" className="w-full sm:w-auto rounded-xl text-xs h-9 shadow-xs px-4">
                    <UserPlus size={13} className="mr-1.5" />
                    <span>{connectLoading ? '...' : 'Connect'}</span>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
 
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-border/60 bg-secondary/10 rounded-2xl p-3 text-center">
          <div>
            <span className="text-base sm:text-lg font-extrabold text-primary block font-mono">{userPosts.length}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-mono font-bold">Projects</span>
          </div>
          <div className="border-x border-border/40">
            <span className="text-base sm:text-lg font-extrabold text-primary block font-mono">{reactionCount}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-mono font-bold">Total Reactions</span>
          </div>
          <div>
            <span className="text-base sm:text-lg font-extrabold text-primary block font-mono">{commentCount}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-mono font-bold">Comments</span>
          </div>
        </div>
      </Card>
 
      {/* ── TABS ── */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-px">
        <button
          onClick={() => setActiveTab('posts')}
          className={cn(
            "px-4 py-2 text-xs font-bold transition-all relative outline-none flex items-center gap-1.5 rounded-t-xl",
            activeTab === 'posts' ? "text-primary bg-card border-x border-t border-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText size={13} />
          <span>Projects ({userPosts.length})</span>
          {activeTab === 'posts' && <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-card" />}
        </button>
 
        <button
          onClick={() => setActiveTab('about')}
          className={cn(
            "px-4 py-2 text-xs font-bold transition-all relative outline-none flex items-center gap-1.5 rounded-t-xl",
            activeTab === 'about' ? "text-primary bg-card border-x border-t border-border" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Award size={13} />
          <span>Skills & Goals</span>
          {activeTab === 'about' && <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-card" />}
        </button>
      </div>
 
      {/* ── TAB CONTENT ── */}
      <div className="pt-2">
        <AnimatePresence mode="wait">
          {activeTab === 'posts' ? (
            <motion.div key="posts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="space-y-4">
              {userPosts.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-border/80 bg-secondary/10 flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                    <MessageSquare size={24} />
                  </div>
                  <p className="text-sm font-bold text-foreground">No projects posted yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-normal">
                    This builder hasn&apos;t shared any projects or ideas yet.
                  </p>
                </Card>
              ) : (
                userPosts.map(post => (
                  <PostCard key={post.id} post={post} currentUser={currentUser} />
                ))
              )}
            </motion.div>
          ) : (
            <motion.div key="about" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5 rounded-2xl border-border bg-card space-y-3">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block font-mono">Tech Stack</span>
                {!profileUser.skills || profileUser.skills.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No skills listed yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {profileUser.skills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md bg-secondary text-foreground text-xs font-medium border border-border/60">{skill}</span>
                    ))}
                  </div>
                )}
              </Card>
 
              <Card className="p-5 rounded-2xl border-border bg-card space-y-3">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block font-mono">Looking For</span>
                {!profileUser.looking_for || profileUser.looking_for.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Not looking for any specific roles right now.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {profileUser.looking_for.map((item, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-md bg-primary/5 text-primary text-xs font-medium border border-primary/20">{item}</span>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
 
// ── POST CARD ─────────────────────────────────────────────────────────────────
function PostCard({ post, currentUser }) {
  const router = useRouter();
 
  const [reactions, setReactions] = useState(post.reactions || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
 
  const userReaction = reactions.find(r => r.user_id === currentUser?.id);
 
  // ✅ Already secure — uses API route
  const handleReact = async (type) => {
    const response = await fetch('/api/posts/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, type })
    });
 
    if (response.ok) {
      const { data } = await response.json();
      if (data.action === 'added') {
        setReactions([...reactions, { id: data.id, type, user_id: currentUser?.id }]);
      } else {
        setReactions(reactions.filter(r => r.user_id !== currentUser?.id));
      }
    }
  };
 
  // ✅ Already secure — uses API route
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
 
    setSubmitting(true);
    const response = await fetch('/api/posts/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id, content: commentText.trim() })
    });
 
    if (response.ok) {
      const { data } = await response.json();
      setComments([...comments, data]);
      setCommentText('');
      toast.success('Comment posted!');
    }
    setSubmitting(false);
  };
 
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
 
    if (days > 7) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };
 
  return (
    <Card className="p-5 sm:p-6 rounded-2xl border-border bg-card shadow-xs hover:shadow-sm transition-all duration-200 space-y-4">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center font-bold text-xs text-primary shrink-0 overflow-hidden shadow-inner">
            {post.users?.profile_photo ? (
              <img src={post.users.profile_photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{post.users?.name?.charAt(0).toUpperCase() || '?'}</span>
            )}
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-bold text-foreground truncate block">{post.users?.name || 'Student Builder'}</span>
            <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">{formatDate(post.created_at)}</span>
          </div>
        </div>
        {post.stage && (
          <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono tracking-wide uppercase shrink-0">{post.stage}</span>
        )}
      </div>
 
      <div className="space-y-1.5">
        <h3 className="text-sm sm:text-base font-extrabold text-foreground leading-snug">{post.title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-normal whitespace-pre-wrap">{post.description}</p>
      </div>
 
      {post.looking_for && post.looking_for.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono mr-1">Looking for:</span>
          {post.looking_for.map((item, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-medium border border-border/60">{item}</span>
          ))}
        </div>
      )}
 
      <div className="flex items-center gap-4 pt-3 border-t border-border/60">
        <button
          onClick={() => handleReact('fire')}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all outline-none",
            userReaction ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
        >
          <span className="text-sm leading-none">🔥</span>
          <span>{reactions.length}</span>
        </button>
 
        <button
          onClick={() => setShowComments(!showComments)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all outline-none",
            showComments ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
        >
          <MessageCircle size={14} className="opacity-70" />
          <span>{comments.length}</span>
        </button>
      </div>
 
      {showComments && (
        <div className="pt-3 border-t border-border/60 space-y-3 animate-in fade-in duration-200">
          <form onSubmit={handleComment} className="flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-1.5 rounded-xl bg-background border border-border text-xs text-foreground outline-none focus:border-primary transition-all shadow-inner font-sans"
            />
            <Button type="submit" size="sm" disabled={submitting || !commentText.trim()} className="h-8 px-3 rounded-xl text-xs shrink-0 shadow-xs">
              <Send size={11} className="mr-1" />
              <span>{submitting ? '...' : 'Post'}</span>
            </Button>
          </form>
 
          <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
            {comments.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic text-center py-2">No comments yet.</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="p-2.5 rounded-xl bg-background border border-border/60 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground truncate">{c.users?.name || 'Anonymous Student'}</span>
                    <span className="text-[9px] text-muted-foreground font-mono shrink-0">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-normal">{c.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
}