'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';

export default function GoalsPage() {
  const router = useRouter();
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      setCurrentUser(userData);

      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_key', currentWeekKey)
        .order('created_at', { ascending: true });

      setGoals(goalsData || []);
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

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;
    if (goals.length >= 3) {
      toast.error('Maximum 3 goals per week');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_text: newGoalText,
          week_key: currentWeekKey
        })
      });

      if (response.ok) {
        const { data } = await response.json();
        setGoals([...goals, data]);
        setNewGoalText('');
        setShowAddModal(false);
        toast.success('Goal added!');
      } else {
        toast.error('Failed to add goal');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
    setSubmitting(false);
  };

  const handleToggle = async (goalId, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';

    // Optimistic update
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
        body: JSON.stringify({
          goal_id: goalId,
          status: newStatus
        })
      });

      if (!response.ok) {
        // Revert on error
        setGoals(goals);
        toast.error('Failed to update goal');
      }
    } catch (error) {
      setGoals(goals);
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async (goalId) => {
    if (!confirm('Delete this goal?')) return;

    // Optimistic update
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
      toast.error('Something went wrong');
    }
  };

  const completedCount = goals.filter(g => g.status === 'done').length;
  const progressPercentage = goals.length > 0 ? (completedCount / goals.length) * 100 : 0;

  if (loading) {
    return (
      <div style={{ 
  minHeight: '100vh', 
  background: '#111111',
  paddingTop: '24px',
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingBottom: '80px'
}}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            background: '#161616',
            border: '1px solid #1E1E1E',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <div style={{ width: '200px', height: '28px', background: '#1E1E1E', borderRadius: '4px', marginBottom: '8px' }}></div>
            <div style={{ width: '150px', height: '20px', background: '#1E1E1E', borderRadius: '4px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#111111',
      paddingBottom: '80px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        
        {/* Header Section */}
        <div style={{
          background: '#161616',
          border: '1px solid #1E1E1E',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px'
        }}>
          {/* Orange accent bar */}
          <div style={{
            width: '28px',
            height: '3px',
            background: '#F97316',
            borderRadius: '2px',
            marginBottom: '16px'
          }}></div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '40px',
            fontWeight: '400',
            fontStyle: 'italic',
            color: '#F5F0E8',
            marginBottom: '8px'
          }}>
            Weekly Goals
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px',
            color: '#9A9A8A',
            marginBottom: '24px'
          }}>
            {getWeekRange()} • Week {currentWeekKey.split('-W')[1]}
          </p>

          {/* Progress Bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#F97316',
                fontWeight: '500'
              }}>
                Progress
              </span>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: '600',
                color: '#F5F0E8'
              }}>
                {completedCount} / {goals.length} completed
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: '#1E1E1E',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #F97316 0%, #FB923C 100%)',
                transition: 'width 0.3s ease',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>

          {/* Add Goal Button */}
          {goals.length < 3 && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: '#F97316',
                color: '#111111',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '18px' }}>+</span>
              Add Goal
            </button>
          )}
        </div>

        {/* Goals List */}
        {goals.length === 0 ? (
          <div style={{
            background: '#161616',
            border: '1px solid #1E1E1E',
            borderRadius: '12px',
            padding: '60px 24px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>🎯</div>
            <h3 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '18px',
              fontWeight: '600',
              color: '#F5F0E8',
              marginBottom: '8px'
            }}>
              No goals yet
            </h3>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: '#9A9A8A',
              marginBottom: '20px'
            }}>
              Set up to 3 goals for this week
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: '#F97316',
                color: '#111111',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Add Your First Goal
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {goals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Info Card */}
        <div style={{
          background: '#161616',
          border: '1px solid #1E1E1E',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px'
        }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#F97316',
            fontWeight: '500',
            marginBottom: '12px'
          }}>
            How It Works
          </div>
          <ul style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
            color: '#9A9A8A',
            lineHeight: '1.8',
            paddingLeft: '20px',
            margin: 0
          }}>
            <li>Set up to 3 goals each week</li>
            <li>Check off goals as you complete them</li>
            <li>Build streaks by consistently completing goals</li>
            <li>Stay accountable and track your progress</li>
          </ul>
        </div>
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 1000
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: '#161616',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '24px',
              fontWeight: '600',
              color: '#F5F0E8',
              marginBottom: '8px'
            }}>
              Add New Goal
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: '#9A9A8A',
              marginBottom: '24px'
            }}>
              What do you want to accomplish this week?
            </p>

            <form onSubmit={handleAddGoal}>
              <textarea
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                placeholder="e.g., Ship MVP of my project"
                rows={3}
                style={{
                  width: '100%',
                  background: '#111111',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  padding: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  color: '#F5F0E8',
                  resize: 'vertical',
                  marginBottom: '20px'
                }}
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: 'transparent',
                    color: '#9A9A8A',
                    border: '1px solid #2A2A2A',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newGoalText.trim()}
                  style={{
                    background: '#F97316',
                    color: '#111111',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: submitting || !newGoalText.trim() ? 'not-allowed' : 'pointer',
                    opacity: submitting || !newGoalText.trim() ? 0.5 : 1
                  }}
                >
                  {submitting ? 'Adding...' : 'Add Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCard({ goal, index, onToggle, onDelete }) {
  const isDone = goal.status === 'done';

  return (
    <div style={{
      background: '#161616',
      border: `1px solid ${isDone ? '#F9731640' : '#1E1E1E'}`,
      borderRadius: '12px',
      padding: '20px',
      transition: 'all 0.2s',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Checkbox */}
        <button
          onClick={() => onToggle(goal.id, goal.status)}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            border: `2px solid ${isDone ? '#F97316' : '#2A2A2A'}`,
            background: isDone ? '#F97316' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            marginTop: '2px'
          }}
        >
          {isDone && (
            <span style={{ color: '#111111', fontSize: '14px', fontWeight: '700' }}>✓</span>
          )}
        </button>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px',
            lineHeight: '1.6',
            color: isDone ? '#9A9A8A' : '#F5F0E8',
            textDecoration: isDone ? 'line-through' : 'none',
            marginBottom: '8px'
          }}>
            {goal.goal_text}
          </p>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {goal.streak_count > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                color: '#F97316',
                fontWeight: '500'
              }}>
                <span>🔥</span>
                {goal.streak_count} week{goal.streak_count !== 1 ? 's' : ''} streak
              </div>
            )}
            <button
              onClick={() => onDelete(goal.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9A9A8A',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '12px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}