// app/(app)/goals/page.jsx
// Weekly goals page — set up to 3 goals, check them off, see streaks
// Past weeks are read-only

'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import toast from 'react-hot-toast'
// ─── Helper: get ISO week key like "2025-W18" from any date ──────────────────
function getWeekKey(date) {
  const d = new Date(date)
  // Get the Thursday of the current week (ISO weeks start Monday, Thursday determines year)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = Math.round(
    (((d - week1) / 86400000) + ((week1.getDay() + 6) % 7)) / 7
  ) + 1
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

// ─── Helper: get "Week of May 4" label from a weekKey ────────────────────────
function getWeekLabel(weekKey) {
  // Parse year and week number from "2025-W18"
  const [yearStr, weekStr] = weekKey.split('-W')
  const year = parseInt(yearStr)
  const week = parseInt(weekStr)
  // Find the Monday of that ISO week
  const jan4 = new Date(year, 0, 4)
  const startOfWeek = new Date(jan4)
  startOfWeek.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7)
  return startOfWeek.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GoalsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // ── State ──
  const [user, setUser]           = useState(null)
  const [goals, setGoals]         = useState([])       // goals for current week
  const [loading, setLoading]     = useState(true)     // initial page load
  const [error, setError]         = useState('')        // page-level error
  const [newGoalText, setNewGoalText] = useState('')    // input field value
  const [adding, setAdding]       = useState(false)     // adding goal in progress
  const [addError, setAddError]   = useState('')        // error under input
  const [updatingId, setUpdatingId] = useState(null)   // which goal is being toggled

  // Current week key — calculated once
  const currentWeekKey  = getWeekKey(new Date())
  const currentWeekLabel = getWeekLabel(currentWeekKey)

  // ── Step 1: Get logged-in user on mount ──
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        setError('Not logged in.')
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  // ── Step 2: Once user is loaded, fetch goals for current week ──
  useEffect(() => {
    if (!user) return
    fetchGoals()
  }, [user])

  async function fetchGoals() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/goals?userId=${user.id}&weekKey=${currentWeekKey}`
      )
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to load goals.')
      } else {
        setGoals(json.data)
      }
    } catch (err) {
      setError('Something went wrong. Please refresh.')
    } finally {
      setLoading(false)
    }
  }

  // ── Add a new goal ──
  async function handleAddGoal() {
    setAddError('')
    const trimmed = newGoalText.trim()

    // Client-side validation
    if (!trimmed) {
      setAddError('Please write a goal first.')
      return
    }
    if (trimmed.length > 200) {
      setAddError('Goal must be under 200 characters.')
      return
    }
    if (goals.length >= 3) {
      setAddError('Maximum 3 goals per week.')
      return
    }

    setAdding(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:   user.id,
          goalText: trimmed,
          weekKey:  currentWeekKey,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAddError(json.error || 'Failed to add goal.')
      } else {
        // Optimistic-style: append to local state immediately
        setGoals(prev => [...prev, json.data])
        setNewGoalText('')  // clear input
        toast.success('Goal added!')
      }
    } catch (err) {
      setAddError('Something went wrong. Try again.')
      toast.error('Something went wrong. Try again.')
    } finally {
      setAdding(false)
    }
  }

  // ── Toggle a goal done/pending ──
  async function handleToggle(goal) {
    // Prevent double-clicking
    if (updatingId === goal.id) return

    const newStatus = goal.status === 'done' ? 'pending' : 'done'

    // Optimistic UI — update locally first so it feels instant
    setGoals(prev =>
      prev.map(g =>
        g.id === goal.id
          ? {
              ...g,
              status: newStatus,
              // optimistically adjust streak display too
              streak_count:
                newStatus === 'done'
                  ? g.streak_count + 1
                  : Math.max(0, g.streak_count - 1),
            }
          : g
      )
    )

    setUpdatingId(goal.id)
    try {
      const res = await fetch('/api/goals/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goal.id,
          userId: user.id,
          status: newStatus,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        // Revert optimistic update if API failed
        setGoals(prev =>
          prev.map(g => (g.id === goal.id ? goal : g))
        )
        setError(json.error || 'Failed to update goal.')
      } else {
        // Replace with real server data (streak_count is authoritative from server)
        setGoals(prev =>
          prev.map(g => (g.id === goal.id ? json.data : g))
        )
        // Toast based on what action was taken
        if (newStatus === 'done') {
          toast.success(doneCount + 1 === 3 ? '🎯 All goals done!' : 'Goal complete! 🔥')
        } else {
          toast('Goal unchecked', { icon: '↩️' })
        }
      }
    } catch (err) {
      // Revert on network error too
      setGoals(prev =>
        prev.map(g => (g.id === goal.id ? goal : g))
      )
      toast.error('Something went wrong. Try again.')
      setError('Something went wrong. Try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  // ── Derived values for progress bar ──
  const doneCount  = goals.filter(g => g.status === 'done').length
  const totalCount = goals.length  // max 3
  // Progress bar fill: based on done out of 3 slots (not just goals added)
  const progressPct = Math.round((doneCount / 3) * 100)

  // ── Enter key submits goal ──
  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAddGoal()
  }

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#0f0f1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: '#94a3b8', fontSize: '16px', letterSpacing: '0.08em' }}>
          Loading goals...
        </p>
      </div>
    )
  }

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error && goals.length === 0) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#0f0f1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ color: '#f87171', fontSize: '16px', letterSpacing: '0.08em' }}>
          {error}
        </p>
      </div>
    )
  }

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f1a',
      padding: '40px 24px',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px', fontWeight: 500,
            color: '#f8fafc', letterSpacing: '0.08em',
            margin: 0,
          }}>
            Weekly Goals
          </h1>
          <p style={{
            fontSize: '15px', color: '#94a3b8',
            marginTop: '6px', letterSpacing: '0.08em',
          }}>
            Week of {currentWeekLabel} · {doneCount} of 3 done
          </p>
        </div>

        {/* ── Progress Bar ── */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            height: '6px',
            backgroundColor: '#2a2a4a',
            borderRadius: '999px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              // color changes as you complete more goals
              backgroundColor:
                doneCount === 3 ? '#22d3ee'  // all done → cyan
                : doneCount >= 1 ? '#6c63ff'  // some done → purple
                : '#2a2a4a',                  // none done → grey
              borderRadius: '999px',
              transition: 'width 0.4s ease, background-color 0.4s ease',
            }} />
          </div>
          {doneCount === 3 && (
            <p style={{
              fontSize: '13px', color: '#22d3ee',
              marginTop: '8px', letterSpacing: '0.08em',
            }}>
              🎯 All goals done this week. Respect.
            </p>
          )}
        </div>

        {/* ── Goals List ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {goals.length === 0 && (
            <div style={{
              backgroundColor: '#16213e',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center',
              border: '1px dashed #2a2a4a',
            }}>
              <p style={{ color: '#94a3b8', fontSize: '15px', letterSpacing: '0.08em', margin: 0 }}>
                No goals yet this week. Add up to 3 below.
              </p>
            </div>
          )}

          {goals.map(goal => (
            <div
              key={goal.id}
              style={{
                backgroundColor: '#16213e',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: goal.status === 'done'
                  ? '1px solid #6c63ff'   // purple border when done
                  : '1px solid #2a2a4a',
                transition: 'border-color 0.2s',
                opacity: updatingId === goal.id ? 0.6 : 1,
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggle(goal)}
                disabled={updatingId === goal.id}
                style={{
                  width: '22px', height: '22px',
                  borderRadius: '6px',
                  border: goal.status === 'done' ? '2px solid #6c63ff' : '2px solid #94a3b8',
                  backgroundColor: goal.status === 'done' ? '#6c63ff' : 'transparent',
                  cursor: updatingId === goal.id ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {goal.status === 'done' && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              {/* Goal text */}
              <span style={{
                flex: 1,
                fontSize: '16px',
                color: goal.status === 'done' ? '#94a3b8' : '#f8fafc',
                textDecoration: goal.status === 'done' ? 'line-through' : 'none',
                letterSpacing: '0.08em',
                transition: 'all 0.2s',
              }}>
                {goal.goal_text}
              </span>

              {/* Streak badge */}
              {goal.streak_count > 0 && (
                <div style={{
                  backgroundColor: '#1e1b4b',
                  border: '1px solid #6c63ff',
                  borderRadius: '999px',
                  padding: '3px 10px',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '12px' }}>🔥</span>
                  <span style={{
                    fontSize: '12px', color: '#a78bfa',
                    fontWeight: 500, letterSpacing: '0.08em',
                  }}>
                    {goal.streak_count}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Add Goal Input — only show if less than 3 goals ── */}
        {goals.length < 3 && (
          <div style={{
            backgroundColor: '#16213e',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #2a2a4a',
          }}>
            <p style={{
              fontSize: '13px', color: '#94a3b8',
              marginBottom: '12px', letterSpacing: '0.08em',
              margin: '0 0 12px 0',
            }}>
              {3 - goals.length} slot{3 - goals.length !== 1 ? 's' : ''} remaining
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newGoalText}
                onChange={e => {
                  setNewGoalText(e.target.value)
                  setAddError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Ship the landing page"
                maxLength={200}
                style={{
                  flex: 1,
                  backgroundColor: '#0f0f1a',
                  border: addError ? '1px solid #f87171' : '1px solid #2a2a4a',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#f8fafc',
                  fontSize: '15px',
                  letterSpacing: '0.08em',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAddGoal}
                disabled={adding}
                style={{
                  backgroundColor: adding ? '#2a2a4a' : '#6c63ff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  color: '#f8fafc',
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: adding ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.08em',
                  transition: 'background-color 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {adding ? 'Adding...' : '+ Add'}
              </button>
            </div>

            {/* Input error */}
            {addError && (
              <p style={{
                color: '#f87171', fontSize: '13px',
                marginTop: '8px', letterSpacing: '0.08em',
              }}>
                {addError}
              </p>
            )}
          </div>
        )}

        {/* ── All 3 slots filled message ── */}
        {goals.length >= 3 && doneCount < 3 && (
          <div style={{
            backgroundColor: '#16213e',
            borderRadius: '12px',
            padding: '16px 20px',
            border: '1px solid #2a2a4a',
            textAlign: 'center',
          }}>
            <p style={{ color: '#94a3b8', fontSize: '14px', letterSpacing: '0.08em', margin: 0 }}>
              3 goals set. Now go execute.
            </p>
          </div>
        )}

        {/* ── Non-blocking error toast (for toggle failures) ── */}
        {error && goals.length > 0 && (
          <p style={{
            color: '#f87171', fontSize: '13px',
            marginTop: '16px', letterSpacing: '0.08em',
            textAlign: 'center',
          }}>
            {error}
          </p>
        )}

      </div>
    </div>
  )
}