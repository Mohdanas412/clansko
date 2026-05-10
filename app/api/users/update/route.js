import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Get authenticated user from session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    college,
    branch,
    year,
    bio,
    skills,
    looking_for,
    profile_photo,
    onboarding_done
  } = body;

  // Use authenticated user's ID (don't trust client-provided user_id)
  const userId = user.id;

  // Build update object with only provided fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (college !== undefined) updateData.college = college;
  if (branch !== undefined) updateData.branch = branch;
  if (year !== undefined) updateData.year = year;
  if (bio !== undefined) updateData.bio = bio;
  if (skills !== undefined) updateData.skills = skills;
  if (looking_for !== undefined) updateData.looking_for = looking_for;
  if (profile_photo !== undefined) updateData.profile_photo = profile_photo;
  if (onboarding_done !== undefined) updateData.onboarding_done = onboarding_done;

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}