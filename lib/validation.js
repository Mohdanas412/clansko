// lib/validation.js
// Shared input validation helpers for all API routes.
// Each validator returns { ok: true } or { ok: false, error: string, status: number }.

// ─── Primitives ───────────────────────────────────────────────────────────────

function str(value, field, min, max) {
  if (typeof value !== 'string') {
    return { ok: false, error: `${field} must be a string.`, status: 400 }
  }
  const trimmed = value.trim()
  if (trimmed.length < min) {
    return { ok: false, error: `${field} must be at least ${min} character${min === 1 ? '' : 's'}.`, status: 400 }
  }
  if (trimmed.length > max) {
    return { ok: false, error: `${field} must be ${max} characters or fewer.`, status: 400 }
  }
  return { ok: true, value: trimmed }
}

function strArray(value, field, maxItems, maxItemLen) {
  if (!Array.isArray(value)) {
    return { ok: false, error: `${field} must be an array.`, status: 400 }
  }
  if (value.length > maxItems) {
    return { ok: false, error: `${field} can have at most ${maxItems} items.`, status: 400 }
  }
  for (const item of value) {
    if (typeof item !== 'string' || item.trim().length === 0) {
      return { ok: false, error: `Each item in ${field} must be a non-empty string.`, status: 400 }
    }
    if (item.trim().length > maxItemLen) {
      return { ok: false, error: `Each item in ${field} must be ${maxItemLen} characters or fewer.`, status: 400 }
    }
  }
  return { ok: true, value: value.map(s => s.trim()) }
}

// ─── Route validators ─────────────────────────────────────────────────────────

const VALID_STAGES = ['idea', 'validation', 'building', 'launched']

/**
 * Validate POST /api/posts/create body.
 * @param {{ title, description, stage, looking_for }} body
 */
export function validatePost(body) {
  const { title, description, stage, looking_for } = body

  const titleResult = str(title, 'title', 3, 100)
  if (!titleResult.ok) return titleResult

  const descResult = str(description, 'description', 10, 2000)
  if (!descResult.ok) return descResult

  if (!VALID_STAGES.includes(stage)) {
    return {
      ok: false,
      error: `stage must be one of: ${VALID_STAGES.join(', ')}.`,
      status: 400,
    }
  }

  let lookingForValue = []
  if (looking_for !== undefined && looking_for !== null) {
    if (!Array.isArray(looking_for)) {
      return { ok: false, error: 'looking_for must be an array.', status: 400 }
    }
    const lfResult = strArray(looking_for, 'looking_for', 7, 30)
    if (!lfResult.ok) return lfResult
    lookingForValue = lfResult.value
  }

  return {
    ok: true,
    value: {
      title: titleResult.value,
      description: descResult.value,
      stage,
      looking_for: lookingForValue,
    },
  }
}

/**
 * Validate POST /api/posts/comment body.
 * @param {{ postId, content }} body
 */
export function validateComment(body) {
  const { postId, content } = body

  if (!postId || typeof postId !== 'string') {
    return { ok: false, error: 'postId is required.', status: 400 }
  }

  const contentResult = str(content, 'content', 1, 500)
  if (!contentResult.ok) return contentResult

  return { ok: true, value: { postId: postId.trim(), content: contentResult.value } }
}

/**
 * Validate PATCH /api/users/update body.
 * All fields are optional — only validates the ones present.
 */
export function validateUserUpdate(body) {
  const { name, bio, skills, looking_for } = body

  if (name !== undefined) {
    const r = str(name, 'name', 1, 100)
    if (!r.ok) return r
  }

  if (bio !== undefined && bio !== null) {
    const r = str(bio, 'bio', 0, 500)
    if (!r.ok) return r
  }

  if (skills !== undefined) {
    const r = strArray(skills, 'skills', 10, 30)
    if (!r.ok) return r
  }

  if (looking_for !== undefined) {
    const r = strArray(looking_for, 'looking_for', 10, 30)
    if (!r.ok) return r
  }

  return { ok: true }
}

/**
 * Validate POST /api/connections/request body.
 * @param {{ receiverId, message }} body
 */
export function validateConnectionRequest(body) {
  const { receiverId, message } = body

  if (!receiverId || typeof receiverId !== 'string' || receiverId.trim().length === 0) {
    return { ok: false, error: 'receiverId is required.', status: 400 }
  }

  if (message !== undefined && message !== null) {
    const r = str(message, 'message', 0, 300)
    if (!r.ok) return r
  }

  return { ok: true, value: { receiverId: receiverId.trim(), message: message?.trim() || null } }
}

/**
 * Validate POST /api/goals body.
 * @param {{ goal_text, week_key }} body
 */
export function validateGoal(body) {
  const { goal_text, week_key } = body

  const goalResult = str(goal_text, 'goal_text', 3, 200)
  if (!goalResult.ok) return goalResult

  // week_key format: "YYYY-Www" e.g. "2026-W39"
  if (!week_key || typeof week_key !== 'string' || !/^\d{4}-W\d{2}$/.test(week_key)) {
    return { ok: false, error: 'week_key must be in YYYY-Www format (e.g. 2026-W39).', status: 400 }
  }

  return { ok: true, value: { goal_text: goalResult.value, week_key } }
}
