'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2, Zap, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/Button';

export default function SignupPage() {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email, password })
      });

      const result = await response.json();

      if (response.ok) {
        // Authenticate client-side to enforce local storage bindings exactly
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          toast.error(signInError.message);
          setLoading(false);
          return;
        }

        toast.success('Account created successfully!');
        window.location.href = '/onboarding';
      } else {
        toast.error(result.error || 'Sign up failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Network error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-background font-sans overflow-hidden">
      
      {/* ── EDITORIAL SPLIT-SCREEN PRESENTATION PANEL (Left) ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-secondary/20 border-r border-border relative flex-col justify-between p-12 overflow-hidden">
        {/* Soft background ambient gradient meshes */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-[10%] right-[-10%] w-[350px] h-[350px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />
        
        {/* Top Brand Identity block */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <span className="font-extrabold text-white text-base tracking-wider">C</span>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-foreground">ClanSko</span>
          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono tracking-wide uppercase">
            Join the Network
          </span>
        </div>

        {/* Emotional Engagement Graphic Context block */}
        <div className="relative z-10 space-y-6 my-auto max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border/60 shadow-xs">
            <Zap size={13} className="text-primary" />
            <span className="text-[11px] font-bold text-foreground uppercase tracking-wider font-mono">
              Built for Consistency
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-[1.15]">
            Build your profile. Find your crew.
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed font-normal">
            ClanSko is built for Indian students who want to build and launch stuff. Sign up to share your projects, track your weekly goals, and connect with other builders.
          </p>

          {/* Value verification sequence */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <CheckCircle2 size={12} />
              </div>
              <span className="text-xs font-bold text-foreground">Verified Indian student profiles</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <CheckCircle2 size={12} />
              </div>
              <span className="text-xs font-bold text-foreground">Honest feedback from students building real projects</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <CheckCircle2 size={12} />
              </div>
              <span className="text-xs font-bold text-foreground">No filler, just ambitious students pushing each other</span>
            </div>
          </div>
        </div>

        {/* Bottom review / credentials highlight */}
        <div className="relative z-10 pt-6 border-t border-border/40 flex items-center gap-3">
          <ShieldCheck size={20} className="text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground font-medium">
            Your privacy matters. We keep your contact details safe until you choose to connect.
          </p>
        </div>
      </div>

      {/* ── INTERACTIVE FORM LAYOUT CANVAS (Right) ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto custom-scrollbar">
        
        {/* Subtle decorative top right radial gradient for light balance */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in duration-300 my-auto py-6">
          
          {/* Mobile top navigation helper */}
          <div className="flex lg:hidden items-center gap-2 pb-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
              <span className="font-extrabold text-white text-xs">C</span>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-foreground">ClanSko</span>
          </div>

          {/* Form Header Context */}
          <div className="space-y-2 text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Create your account
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Join thousands of Indian students building cool stuff.
            </p>
          </div>

          {/* Main Credentials Input Form Wrapper */}
          <form onSubmit={handleSignup} className="space-y-4 pt-2">
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground tracking-wide">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aman Gupta"
                className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground tracking-wide">
                Email address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground tracking-wide">
                Create Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground tracking-wide">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-sans"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full rounded-xl h-11 text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm"
              >
                <span>{loading ? 'Creating account...' : 'Sign Up Free'}</span>
                {!loading && <ArrowRight size={15} className="ml-1.5" />}
              </Button>
            </div>

          </form>

          {/* Footer Router Callout */}
          <div className="pt-6 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-0.5">
                <span>Log in</span>
                <ArrowRight size={11} className="ml-0.5 inline" />
              </Link>
            </p>
          </div>

          {/* Core mission footer disclaimer */}
          <p className="text-[11px] text-muted-foreground/70 text-center font-mono pt-4 block">
            By signing up, you agree to build cool stuff and respect the community.
          </p>

        </div>

      </div>

    </div>
  );
}