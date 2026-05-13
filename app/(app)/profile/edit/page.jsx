'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import { 
  User, 
  GraduationCap, 
  Terminal, 
  Compass, 
  Plus, 
  X, 
  ArrowLeft, 
  Save, 
  Layers,
  Sparkles
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function EditProfilePage() {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Core Form attributes
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [lookingFor, setLookingFor] = useState('');

  useEffect(() => {
    async function loadProfile() {
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

      if (userData) {
        setCurrentUser(userData);
        setName(userData.name || '');
        setCollege(userData.college || '');
        setBranch(userData.branch || '');
        setYear(userData.year || '');
        setBio(userData.bio || '');
        setSkills(userData.skills || []);
        setLookingFor(userData.looking_for?.[0] || '');
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase, router]);

  const handleAddSkill = () => {
    if (skillInput.trim() && skills.length < 5) {
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim() || !college.trim() || !branch.trim() || !year) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          college: college.trim(),
          branch: branch.trim(),
          year,
          bio: bio.trim(),
          skills,
          looking_for: lookingFor ? [lookingFor] : []
        })
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
        router.push(`/profile/${currentUser.id}`);
      } else {
        const errorRes = await response.json();
        toast.error(errorRes.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Network error. Please try again.');
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 animate-in fade-in duration-300">
        <div className="w-48 h-8 rounded-lg bg-secondary animate-pulse" />
        <div className="w-full h-64 rounded-2xl bg-secondary animate-pulse" />
        <div className="w-full h-64 rounded-2xl bg-secondary animate-pulse" />
      </div>
    );
  }

  const LOOKING_FOR_OPTIONS = [
    { value: 'Co-founder', label: 'Find a Co-founder' },
    { value: 'Collaborator', label: 'Find Project Collaborators' },
    { value: 'Mentor', label: 'Find a Mentor' },
    { value: 'Accountability Partner', label: 'Find an Accountability Partner' },
    { value: 'Just Exploring', label: 'Just Exploring' }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto animate-in fade-in duration-300 space-y-6">
      
      {/* ── HEADER CONTEXT ROW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono tracking-wide uppercase">
              PROFILE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Edit Profile
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Update your info, tech stack, and what you&apos;re looking for to find the right teammates.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/profile/${currentUser?.id}`)}
          className="rounded-xl text-xs h-9 self-start sm:self-auto shrink-0 shadow-xs"
        >
          <ArrowLeft size={13} className="mr-1.5" />
          <span>Back to Profile</span>
        </Button>
      </div>

      {/* ── MODULAR FORM CANVAS ── */}
      <form onSubmit={handleSave} className="space-y-6 pt-2">
        
        {/* MODULE 1: Primary Identification Card */}
        <Card className="p-6 rounded-2xl border-border bg-card space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <User size={13} />
            </div>
            <span className="text-xs font-bold text-foreground tracking-wide uppercase font-mono">
              Basic Info
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground tracking-wide">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full legal or creator name"
                className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground tracking-wide">
                College / University *
              </label>
              <input
                type="text"
                required
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. Stanford, IIT Delhi"
                className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground tracking-wide">
                  Branch / Major *
                </label>
                <input
                  type="text"
                  required
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="e.g. CSE, AI, Electronics"
                  className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground tracking-wide">
                  Year of Study *
                </label>
                <select
                  required
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-xs text-foreground outline-none focus:border-primary transition-all font-sans"
                >
                  <option value="" disabled>Select your year</option>
                  <option value="1">1st Year / Freshman</option>
                  <option value="2">2nd Year / Sophomore</option>
                  <option value="3">3rd Year / Junior</option>
                  <option value="4">4th Year / Senior</option>
                  <option value="5">Graduate / Post-Grad</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* MODULE 2: Technical capabilities & stack configuration Card */}
        <Card className="p-6 rounded-2xl border-border bg-card space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Terminal size={13} />
            </div>
            <span className="text-xs font-bold text-foreground tracking-wide uppercase font-mono">
              Bio & Tech Stack
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground tracking-wide">
                Bio
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a bit about yourself, what you love building, and your current interests..."
                className="w-full p-3.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all font-sans resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-foreground tracking-wide">
                  Tech Stack
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {skills.length}/5 skills max
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="e.g. Node.js, WebSockets, GSAP"
                  disabled={skills.length >= 5}
                  className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all font-sans"
                />
                <Button
                  type="button"
                  onClick={handleAddSkill}
                  disabled={!skillInput.trim() || skills.length >= 5}
                  variant="secondary"
                  className="h-11 px-4 rounded-xl text-xs font-bold shrink-0"
                >
                  <Plus size={14} />
                </Button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {skills.map((skill, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/5 text-primary border border-primary/20 text-xs font-medium font-sans">
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(idx)}
                        className="text-primary hover:text-primary/70 outline-none"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* MODULE 3: Ecosystem Intent mapping parameters */}
        <Card className="p-6 rounded-2xl border-border bg-card space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Compass size={13} />
            </div>
            <span className="text-xs font-bold text-foreground tracking-wide uppercase font-mono">
              Looking For
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-foreground tracking-wide">
              What are you primarily looking for on ClanSko?
            </label>
            <select
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-xs text-foreground outline-none focus:border-primary transition-all font-sans"
            >
              <option value="">Select what you&apos;re looking for</option>
              {LOOKING_FOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Sticky-feeling submission action wrapper */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/profile/${currentUser?.id}`)}
            disabled={submitting}
            className="rounded-xl text-xs h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-xl text-xs h-10 px-5 font-bold shadow-xs hover:shadow-sm"
          >
            <Save size={13} className="mr-1.5" />
            <span>{submitting ? 'Saving...' : 'Save Profile'}</span>
          </Button>
        </div>

      </form>

    </div>
  );
}