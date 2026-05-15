// app/(app)/goals/page.jsx
'use client';
 
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Flame, Plus, Check, Trash2, Calendar, X, Sparkles, Award } from 'lucide-react';
 
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
 
export default function GoalsPage() {
  const router = useRouter();
 
  // ✅ SAFE — browser client used only for auth check below
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );
 
  const [currentUser, setCurrentUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [submitting, setSubmitting] = useState(false);
 
  const currentWeekKey = getWeekKey(new Date());
 
  useEffect(() => {
    async function init() {
      // ✅ SAFE — auth check on client is fine
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
 
      // ✅ FIX: Was supabase.from('users') direct call.
      // Now goes through the API route which verifies auth server-side.
      const userRes = await fetch(`/api/users/${user.id}`);
      const userJson = await userRes.json();
      if (userRes.ok) {
        setCurrentUser(userJson.data);
      }
 
      // ✅ FIX: Was supabase.from('goals') direct call — anyone could read any
      // user's private goals by changing user_id. The API route enforces
      // ownership server-side using the auth session.
      const goalsRes = await fetch(`/api/goals?week_key=${currentWeekKey}`);
      const goalsJson = await goalsRes.json();
      if (goalsRes.ok) {
        setGoals(goalsJson.data || []);
      }
 
      setLoading(false);
    }
 
    init();
  }, [supabase, router, currentWeekKey]);
 
  function getWeekKey(date) {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }
 
  function getWeekRange() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
 
    const formatDate = (date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}`;
    };
 
    return `${formatDate(monday)} - ${formatDate(sunday)}`;
  }
 
  // ✅ Already secure — uses API route
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    if (goals.length >= 3) {
      toast.error('Limit reached: You can only set up to 3 weekly goals');
      return;
    }
 
    setSubmitting(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_text: newGoalText.trim(),
          week_key: currentWeekKey
        })
      });
 
      if (response.ok) {
        const { data } = await response.json();
        setGoals([...goals, data]);
        setNewGoalText('');
        setShowAddModal(false);
        toast.success('Goal added successfully!');
      } else {
        toast.error('Failed to add goal');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
    setSubmitting(false);
  };
 
  // ✅ Already secure — uses API route
  const handleToggle = async (goalId, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
 
    setGoals(goals.map(g => {
      if (g.id === goalId) {
        const newStreakCount = newStatus === 'done'
          ? g.streak_count + 1
          : Math.max(0, g.streak_count - 1);
        return { ...g, status: newStatus, streak_count: newStreakCount };
      }
      return g;
    }));
 
    try {
      const response = await fetch('/api/goals/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal_id: goalId, status: newStatus })
      });
 
      if (!response.ok) {
        setGoals([...goals]);
        toast.error('Failed to update goal');
      }
    } catch (error) {
      setGoals([...goals]);
      toast.error('Error updating goal');
    }
  };
 
  // ✅ Already secure — uses API route
  const handleDelete = async (goalId) => {
    if (!confirm('Are you sure you want to delete this weekly goal?')) return;
 
    const oldGoals = [...goals];
    setGoals(goals.filter(g => g.id !== goalId));
 
    try {
      const response = await fetch(`/api/goals?goal_id=${goalId}`, {
        method: 'DELETE'
      });
 
      if (!response.ok) {
        setGoals(oldGoals);
        toast.error('Failed to delete goal');
      } else {
        toast.success('Goal deleted');
      }
    } catch (error) {
      setGoals(oldGoals);
      toast.error('Network error. Could not delete.');
    }
  };
 
  const completedCount = goals.filter(g => g.status === 'done').length;
  const progressPercentage = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;
 
  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="w-full h-44 rounded-2xl bg-secondary animate-pulse" />
        <div className="space-y-3">
          <div className="w-full h-20 rounded-xl bg-secondary animate-pulse" />
          <div className="w-full h-20 rounded-xl bg-secondary animate-pulse" />
        </div>
      </div>
    );
  }
 
  return (
    <div className="w-full max-w-3xl mx-auto animate-in fade-in duration-300 space-y-6">
 
      {/* ── MOTIVATIONAL HERO BLOCK ── */}
      <Card className="p-6 sm:p-8 rounded-2xl border-border/80 bg-gradient-to-br from-card via-card to-primary/5 relative overflow-hidden shadow-sm">
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-primary/10 blur-xl pointer-events-none" />
 
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wider font-mono uppercase">
              <Calendar size={11} />
              <span>Week {currentWeekKey.split('-W')[1]}</span>
            </div>
 
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Weekly Objectives
            </h1>
 
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Set up to 3 clear goals for the week. Check them off to build weekly streaks and stay accountable.
            </p>
 
            <p className="text-[11px] text-muted-foreground/80 font-mono pt-1">
              This Week: <span className="text-foreground font-bold">{getWeekRange()}</span>
            </p>
          </div>
 
          <div className="bg-background/80 backdrop-blur-md border border-border rounded-xl p-4 w-full sm:w-56 shrink-0 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Progress</span>
              <span className="text-xs font-extrabold text-primary font-mono">
                {completedCount} / {goals.length} Completed
              </span>
            </div>
 
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
 
            {goals.length < 3 && (
              <Button onClick={() => setShowAddModal(true)} size="sm" className="w-full h-8 text-xs rounded-lg shadow-xs mt-1">
                <Plus size={13} className="mr-1 shrink-0" />
                <span>Add Goal</span>
              </Button>
            )}
          </div>
        </div>
      </Card>
 
      {/* ── GOALS LIST ── */}
      <div className="space-y-3">
        {goals.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-border/80 bg-secondary/10 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
              <Target size={24} />
            </div>
            <p className="text-sm font-bold text-foreground">No Goals Set for This Week</p>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-normal">
              Set clear, bite-sized goals to focus on shipping real work and sharing progress with friends.
            </p>
            <Button size="sm" onClick={() => setShowAddModal(true)} className="mt-2 text-xs h-8">
              Add First Goal
            </Button>
          </Card>
        ) : (
          goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
            >
              <GoalCard goal={goal} onToggle={handleToggle} onDelete={handleDelete} />
            </motion.div>
          ))
        )}
      </div>
 
      {/* ── HOW IT WORKS ── */}
      <Card className="p-5 rounded-xl border-border/60 bg-secondary/20 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Award size={14} className="text-primary" />
          <span>How Accountability Works</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed font-normal">
          Setting a cap of 3 goals keeps you focused on what actually matters. Complete your weekly targets to grow your streaks and show up consistently in the feed.
        </p>
      </Card>
 
      {/* ── ADD GOAL MODAL ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-border bg-background/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Add Weekly Goal</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Focus on shipping real work</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="h-8 w-8 rounded-lg">
                  <X size={14} />
                </Button>
              </div>
 
              <form onSubmit={handleAddGoal} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block font-mono">
                    What is your goal for this week?
                  </label>
                  <textarea
                    value={newGoalText}
                    onChange={e => setNewGoalText(e.target.value)}
                    placeholder="e.g., Build the landing page UI and integrate NextAuth..."
                    rows={3}
                    className="w-full p-3 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground outline-none focus:border-primary transition-all font-sans resize-none"
                    autoFocus
                  />
                  <p className="text-[10px] text-muted-foreground">Keep it realistic, achievable, and actionable.</p>
                </div>
 
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowAddModal(false)} className="text-xs h-8">
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" disabled={submitting || !newGoalText.trim()} className="text-xs h-8 shadow-xs">
                    {submitting ? 'Adding...' : 'Add Goal'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
 
    </div>
  );
}
 
// ── GOAL CARD ─────────────────────────────────────────────────────────────────
function GoalCard({ goal, onToggle, onDelete }) {
  const isDone = goal.status === 'done';
 
  return (
    <Card className={cn(
      "p-4 sm:p-5 rounded-xl border transition-all duration-200 group flex items-start gap-3.5 relative overflow-hidden",
      isDone
        ? "bg-secondary/20 border-border/60 shadow-none"
        : "bg-card border-border hover:border-primary/40 hover:shadow-xs"
    )}>
      {isDone && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/60" />
      )}
 
      <button
        onClick={() => onToggle(goal.id, goal.status)}
        className={cn(
          "w-5 h-5 sm:w-6 sm:h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all outline-none",
          isDone
            ? "bg-emerald-500 border-emerald-600 text-white shadow-inner"
            : "bg-background border-border text-transparent hover:border-primary/60 group-hover:bg-primary/5"
        )}
        title={isDone ? "Uncheck" : "Mark as Done"}
      >
        <Check size={12} className={cn(isDone && "stroke-[3]")} />
      </button>
 
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs sm:text-sm leading-relaxed transition-all font-normal",
          isDone ? "text-muted-foreground line-through decoration-muted-foreground/60 font-medium" : "text-foreground font-semibold"
        )}>
          {goal.goal_text}
        </p>
 
        <div className="flex items-center gap-3 mt-2 pt-1">
          {goal.streak_count > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono tracking-wide">
              <Flame size={10} className="fill-primary" />
              <span>{goal.streak_count} Week Streak</span>
            </span>
          )}
          <span className={cn(
            "text-[9px] font-mono tracking-wider uppercase font-bold",
            isDone ? "text-emerald-600" : "text-amber-600"
          )}>
            {isDone ? "Completed" : "In Progress"}
          </span>
        </div>
      </div>
 
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(goal.id)}
        className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-red-600 hover:bg-red-50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Delete goal"
      >
        <Trash2 size={13} />
      </Button>
    </Card>
  );
}