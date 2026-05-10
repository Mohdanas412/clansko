// app/api/sko/chat/route.js

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )
}

function getISOWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  )
}

function buildSkoSystemPrompt(user, posts, connections, goals) {
  const today = new Date()
  const weekNumber = getISOWeek(today)
  const weekKey = `${today.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`

  const userSection = user
    ? `NAME: ${user.name}
COLLEGE: ${user.college || 'not filled'}
BRANCH: ${user.branch || 'not filled'}
YEAR: ${user.year || 'not filled'}
BIO: ${user.bio || 'not written'}
SKILLS: ${user.skills?.length ? user.skills.join(', ') : 'not listed'}
LOOKING FOR: ${user.looking_for?.length ? user.looking_for.join(', ') : 'not specified'}`
    : 'Profile not loaded.'

  const ideasSection =
    posts?.length > 0
      ? posts
          .slice(0, 3)
          .map(p => `- "${p.title}": ${p.description} (Stage: ${p.stage || 'unknown'})`)
          .join('\n')
      : 'No project idea posted yet on ClanSko.'

  const teamSection =
    connections?.length > 0
      ? connections
          .slice(0, 5)
          .map(c => {
            const member = c.sender_id === user?.id ? c.receiver : c.sender
            return `- ${member?.name || 'Unknown'} (Skills: ${member?.skills?.join(', ') || 'not listed'})`
          })
          .join('\n')
      : 'No connections yet. Flying solo.'

  const thisWeekGoals = goals?.filter(g => g.week_key === weekKey) || []
  const goalsSection =
    thisWeekGoals.length > 0
      ? thisWeekGoals
          .map(g => `- [${g.status === 'done' ? 'DONE' : 'pending'}] ${g.goal_text} (streak: ${g.streak_count})`)
          .join('\n')
      : 'No goals set for this week yet.'

  return `You are Sko — the AI thinking partner inside ClanSko, a platform for serious builder-minded engineering students in India.

You are NOT a generic chatbot. You are a persistent AI clan member who already knows this user's project, team, goals, and profile. This is your superpower — use it always.

━━━ USER CONTEXT ━━━
${userSection}

━━━ THEIR PROJECT IDEA ━━━
${ideasSection}

━━━ THEIR TEAM (accepted connections) ━━━
${teamSection}

━━━ THIS WEEK'S GOALS (${weekKey}) ━━━
${goalsSection}

━━━ YOUR PERSONALITY ━━━
- Brutally honest but genuinely encouraging
- Speak like a smart senior who has actually built things — not a textbook, not a life coach
- Always reference their actual context (name, idea, skills, goals) — never give generic advice
- Short and punchy by default. Go deep only when they ask for it
- If they write in Hinglish, respond in Hinglish. Match their energy
- Call out flawed thinking directly. No sugarcoating
- Never say "Great question!" or "Certainly!" — that is cringe
- If their profile is empty, firmly tell them to fill it first so you can actually help

━━━ YOUR SCOPE ━━━
Help with: idea validation, what to build first, cofounder search, goal setting, getting unstuck, team role clarity, honest feedback on thinking
Do NOT: write code, manage tasks line by line, send notifications, replace their teammates`
}

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient()

    // 1. Auth check
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = authUser.id

    // 2. Parse request body
    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
    }

    // 3. Fetch user context in parallel
    const [userResult, postsResult, connectionsResult, goalsResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).maybeSingle(),

      supabase
        .from('posts')
        .select('id, title, description, stage')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3),

      supabase
        .from('connections')
        .select(`
          id, sender_id, receiver_id,
          sender:users!connections_sender_id_fkey(name, skills),
          receiver:users!connections_receiver_id_fkey(name, skills)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted')
        .limit(5),

      supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    // 4. Build system prompt with real context
    const systemPrompt = buildSkoSystemPrompt(
      userResult.data,
      postsResult.data || [],
      connectionsResult.data || [],
      goalsResult.data || []
    )

    // 5. Call Groq API
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({
              role: m.role === 'model' ? 'assistant' : m.role,
              content: m.parts[0].text,
            })),
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      }
    )

    if (!groqResponse.ok) {
      const errText = await groqResponse.text()
      console.error('Groq API error:', errText)
      return NextResponse.json({ error: 'AI service error. Try again.' }, { status: 502 })
    }

    const groqData = await groqResponse.json()
    const reply = groqData?.choices?.[0]?.message?.content

    if (!reply) {
      return NextResponse.json({ error: 'No response from AI. Try again.' }, { status: 502 })
    }

    return NextResponse.json({ reply }, { status: 200 })

  } catch (err) {
    console.error('Sko chat error:', err)
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
}