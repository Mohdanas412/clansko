'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Layers, Compass, Command } from 'lucide-react';

import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok) {
        // Sign in on client side to preserve local auth persistence rules exactly
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          toast.error(signInError.message);
          setLoading(false);
          return;
        }

        toast.success('Welcome back!');
        window.location.href = '/feed';
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error. Please check your connection.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-background font-sans overflow-hidden">
      
      {/* ── EDITORIAL SPLIT-SCREEN PRESENTATION PANEL (Left) ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-secondary/30 border-r border-border relative flex-col justify-between p-12 overflow-hidden">
        {/* Soft background ambient gradient meshes */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />
        
        {/* Top Brand Identity block */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <span className="font-extrabold text-white text-base tracking-wider">C</span>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-foreground">ClanSko</span>
          <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono tracking-wide uppercase">
            FOR BUILDERS
          </span>
        </div>

        {/* Emotional Engagement Graphic Context block */}
        <div className="relative z-10 space-y-6 my-auto max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border/60 shadow-xs">
            <Sparkles size={13} className="text-primary" />
            <span className="text-[11px] font-bold text-foreground uppercase tracking-wider font-mono">
              Built for Students
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-[1.15]">
            Where ambitious student builders team up.
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed font-normal">
            Skip the generic social media noise. Join a community built for building cool stuff, staying consistent, and finding awesome team members.
          </p>

          {/* Micro preview grid elements illustrating startup culture */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="p-3.5 rounded-xl bg-background/80 border border-border/40 backdrop-blur-xs space-y-1">
              <span className="text-lg font-extrabold text-foreground block font-mono">4.2x</span>
              <span className="text-[11px] text-muted-foreground font-medium block">Faster team formation</span>
            </div>
            <div className="p-3.5 rounded-xl bg-background/80 border border-border/40 backdrop-blur-xs space-y-1">
              <span className="text-lg font-extrabold text-primary block font-mono">100%</span>
              <span className="text-[11px] text-muted-foreground font-medium block">Verified student builder profiles</span>
            </div>
          </div>
        </div>

        {/* Bottom review / credentials highlight */}
        <div className="relative z-10 pt-6 border-t border-border/40 flex items-center gap-3">
          <div className="flex -space-x-2 overflow-hidden">
            <div className="inline-block h-7 w-7 rounded-full ring-2 ring-background bg-primary/20 font-bold text-[9px] flex items-center justify-center text-primary">JD</div>
            <div className="inline-block h-7 w-7 rounded-full ring-2 ring-background bg-secondary font-bold text-[9px] flex items-center justify-center text-foreground">AK</div>
            <div className="inline-block h-7 w-7 rounded-full ring-2 ring-background bg-amber-500/20 font-bold text-[9px] flex items-center justify-center text-amber-700">SR</div>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Joined by top student builders across <span className="text-foreground font-semibold">IITs, NITs, and BITS</span>.
          </p>
        </div>
      </div>

      {/* ── INTERACTIVE FORM LAYOUT CANVAS (Right) ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto custom-scrollbar">
        
        {/* Subtle decorative top right radial gradient for light balance */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in duration-300">
          
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
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Sign in to check out the live feed and update your weekly goals.
            </p>
          </div>

          {/* Main Credentials Input Form Wrapper */}
          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground tracking-wide">
                Email address
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
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-foreground tracking-wide">
                  Password
                </label>
                <Link 
                  href="/login" 
                  onClick={(e) => { e.preventDefault(); toast.error("Password reset links will be available soon.") }}
                  className="text-[11px] text-primary font-semibold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
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
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                {!loading && <ArrowRight size={15} className="ml-1.5" />}
              </Button>
            </div>

          </form>

          {/* Footer Router Callout */}
          <div className="pt-6 border-t border-border/60 text-center">
            <p className="text-xs text-muted-foreground font-medium">
              Don&apos;t have an account yet?{' '}
              <Link href="/signup" className="text-primary font-bold hover:underline inline-flex items-center gap-0.5">
                <span>Sign up for free</span>
                <ArrowRight size={11} className="ml-0.5 inline" />
              </Link>
            </p>
          </div>

          {/* Core mission footer disclaimer */}
          <p className="text-[11px] text-muted-foreground/70 text-center font-mono pt-4 block">
            ClanSko • Built by students for ambitious students
          </p>

        </div>

      </div>

    </div>
  );
}