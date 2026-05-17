'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  Target, 
  Zap, 
  ChevronRight, 
  Menu, 
  X, 
  MessageSquare, 
  Layers, 
  Cpu, 
  BookOpen, 
  Quote,
  Compass,
  Flame
} from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('all')

  // Sample builder preview data for the Showcase section
  const sampleBuilders = [
    {
      name: "Aarav Sharma",
      role: "Full-Stack / Next.js",
      college: "IIT Roorkee",
      idea: "AI-powered API documentation generator",
      tags: ["React", "Node.js", "Postgres"],
      status: "Looking for Co-founder"
    },
    {
      name: "Nehal Deshmukh",
      role: "UI/UX & Product",
      college: "BITS Pilani",
      idea: "Hyper-local student marketplace app",
      tags: ["Framer", "Tailwind", "Swift"],
      status: "Building MVP"
    },
    {
      name: "Rohan Verma",
      role: "Backend Systems",
      college: "DTU Delhi",
      idea: "Low-latency database caching layer",
      tags: ["Rust", "Go", "Docker"],
      status: "Ready to launch"
    }
  ]

  // Sample articles data
  const articles = [
    {
      title: "Why 95% of student hackathon projects die in a week",
      readTime: "4 min read",
      category: "Mindset",
      excerpt: "The structural difference between building for a weekend prize versus building for real user retention."
    },
    {
      title: "Finding the right technical co-founder on campus",
      readTime: "6 min read",
      category: "Collaboration",
      excerpt: "Look for high agency and proof of execution over pure academic grades. Here is the framework."
    },
    {
      title: "Shipping your first barebones MVP with zero budget",
      readTime: "5 min read",
      category: "Execution",
      excerpt: "Stop over-engineering backend auth. Use simple services, launch fast, and iterate on actual usage."
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10 selection:text-primary overflow-x-hidden relative">
      
      {/* Subtle Background Glass Gradients & Grid pattern */}
      <div className="absolute top-0 left-0 right-0 h-[900px] bg-[linear-gradient(to_bottom,rgba(249,115,22,0.03)_0%,rgba(0,0,0,0)_100%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0 opacity-60" />

      {/* ── 1. PREMIUM NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group relative z-10">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
              <span className="font-bold text-white text-base">C</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none text-foreground">ClanSko</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide mt-0.5">FOR STUDENT BUILDERS</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#why" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Why ClanSko
            </a>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#showcase" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Community
            </a>
            <a href="#ai-partner" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              AI Partner
            </a>
          </nav>

          {/* Right side CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="rounded-xl text-sm font-medium hover:bg-secondary/60">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="rounded-xl px-5 shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 group">
                <span>Join free</span>
                <ArrowRight size={16} className="ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="md:hidden flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-xl"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </Button>
          </div>
        </div>

        {/* Responsive Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-border/60 bg-background/95 backdrop-blur-xl px-4 pt-4 pb-6 space-y-4 overflow-hidden"
            >
              <div className="flex flex-col gap-3 pt-2">
                <a 
                  href="#why" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-base font-medium hover:bg-muted text-foreground transition-colors"
                >
                  Why ClanSko
                </a>
                <a 
                  href="#features" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-base font-medium hover:bg-muted text-foreground transition-colors"
                >
                  How It Works
                </a>
                <a 
                  href="#showcase" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-base font-medium hover:bg-muted text-foreground transition-colors"
                >
                  Community
                </a>
                <a 
                  href="#ai-partner" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-base font-medium hover:bg-muted text-foreground transition-colors"
                >
                  AI Partner
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center rounded-xl h-11">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-center rounded-xl h-11">
                    Join free
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── 2. HERO SECTION ── */}
      <section className="pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
          
          {/* Subtle builder badge */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border/80 text-xs font-medium text-muted-foreground mb-8 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="tracking-wide">Built by students, for ambitious students</span>
            <Sparkles size={12} className="text-primary ml-0.5" />
          </motion.div>

          {/* Main Editorial Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1] mb-6 font-sans"
          >
            Stop building alone.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-orange-500 to-amber-600 font-extrabold">
              Find your co-founders.
            </span>
          </motion.h1>

          {/* Emotional / Founder-focused message */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10 font-normal"
          >
            A community where ambitious students post ideas, team up, share weekly updates, and actually build stuff.
          </motion.p>

          {/* Strategic CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto"
          >
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto rounded-xl shadow-md shadow-primary/20 group h-13 px-8 text-base">
                <span>Join the community — it&apos;s free</span>
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/feed" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl h-13 px-7 text-base border-border/80 hover:bg-secondary/50">
                <Compass size={18} className="mr-2 text-muted-foreground" />
                <span>See what people are building</span>
              </Button>
            </Link>
          </motion.div>

          {/* Micro-assurances */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center justify-center gap-6 mt-8 text-xs text-muted-foreground/80"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-primary" /> No corporate jargon
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-primary" /> Free for students
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-primary" /> Focused on building
            </span>
          </motion.div>
        </div>

        {/* Premium visual composite mockup frame */}
        <div className="mt-16 sm:mt-20 relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent rounded-3xl filter blur-2xl opacity-50 -z-10" />
          
          <Card className="p-2 sm:p-4 rounded-3xl border-border/60 shadow-2xl shadow-black/5 bg-background/80 backdrop-blur-xl">
            <div className="border border-border/40 rounded-2xl bg-card overflow-hidden shadow-inner">
              
              {/* Fake dashboard header bar */}
              <div className="h-11 bg-secondary/40 border-b border-border/40 px-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
                </div>
                <div className="px-3 py-1 rounded-md bg-background/80 border border-border/40 text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                  <span>app.clansko.com/feed</span>
                </div>
                <div className="w-10" /> {/* Spacer */}
              </div>

              {/* Fake Feed Viewport grid */}
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left bg-background/30">
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 rounded-xl border border-border/50 bg-card shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20">
                          AS
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-none">Aniket Sen</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">IIT Bombay • 12 mins ago</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded">Idea</span>
                    </div>
                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      Building a dev tool that turns commit logs into update emails automatically. Looking for a frontend lead who loves crafting clean UIs.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground font-mono">Next.js</span>
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground font-mono">OpenAI API</span>
                      <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground font-mono">Tailwind</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/50 bg-card shadow-sm space-y-3 opacity-90">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 font-bold flex items-center justify-center text-xs border border-blue-500/20">
                          MK
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-none">Mansi Kapoor</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">IIIT Hyderabad • 2 hours ago</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-medium px-2 py-0.5 rounded">Milestone</span>
                    </div>
                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      Just crossed 200 active beta users on our smart campus scheduling micro-app! Massive shoutout to my ClanSko weekly circle for keeping me focused on calling actual users instead of refactoring code again. 🚀
                    </p>
                  </div>
                </div>

                {/* Right side snippet sidebar mockup */}
                <div className="space-y-4 hidden md:block">
                  <div className="p-4 rounded-xl border border-border/50 bg-card shadow-sm space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Weekly Streak</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                        <Flame size={20} className="text-primary fill-primary/20" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">4 Weeks Active</p>
                        <p className="text-[10px] text-muted-foreground">3/3 Goals checked off</p>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full rounded-full w-full" />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border/50 bg-card shadow-sm space-y-2.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Community Stats</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Active builders</span>
                      <span className="font-bold">1,420+</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Projects formed</span>
                      <span className="font-bold text-primary">312</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </div>
      </section>

      {/* ── 3. SOCIAL PROOF SECTION ── */}
      

      {/* ── 4. “HOW CLANSKO WORKS” SECTION ── */}
      <section id="features" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 scroll-mt-20">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <span className="text-xs font-bold text-primary tracking-widest uppercase px-3 py-1 rounded-md bg-primary/10 border border-primary/20">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mt-4 mb-4">
            Built for shipping, not endless scrolling.
          </h2>
          <p className="text-base text-muted-foreground">
            No generic social media noise. Just a clean, 4-step way to validate your ideas, find team members, and launch your project.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Step 1 */}
          <div className="relative group">
            <div className="absolute top-6 left-6 -z-10 w-12 h-12 rounded-2xl bg-secondary transition-transform group-hover:scale-110" />
            <div className="p-6 rounded-2xl border border-border/60 bg-card h-full flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                    01
                  </div>
                  <Users size={20} className="text-muted-foreground" />
                </div>
                <h3 className="text-base font-bold mb-2 text-foreground">Find Builders</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Find verified student builders by their tech stack, college, or what they&apos;re interested in building.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border/40 text-[11px] font-semibold text-primary flex items-center gap-1">
                <span>Verified student profiles</span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative group">
            <div className="absolute top-6 left-6 -z-10 w-12 h-12 rounded-2xl bg-secondary transition-transform group-hover:scale-110" />
            <div className="p-6 rounded-2xl border border-border/60 bg-card h-full flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                    02
                  </div>
                  <Layers size={20} className="text-muted-foreground" />
                </div>
                <h3 className="text-base font-bold mb-2 text-foreground">Build Your Team</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Reach out to people building cool stuff. Form small, 2-4 person teams to build your MVP together.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border/40 text-[11px] font-semibold text-primary flex items-center gap-1">
                <span>No-fluff team building</span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative group">
            <div className="absolute top-6 left-6 -z-10 w-12 h-12 rounded-2xl bg-secondary transition-transform group-hover:scale-110" />
            <div className="p-6 rounded-2xl border border-border/60 bg-card h-full flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                    03
                  </div>
                  <Target size={20} className="text-muted-foreground" />
                </div>
                <h3 className="text-base font-bold mb-2 text-foreground">Stay Consistent</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Set 3 goals every Monday and share your progress. Building in public keeps you consistent and motivated.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border/40 text-[11px] font-semibold text-primary flex items-center gap-1">
                <span>No ghosting allowed</span>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="relative group">
            <div className="absolute top-6 left-6 -z-10 w-12 h-12 rounded-2xl bg-secondary transition-transform group-hover:scale-110" />
            <div className="p-6 rounded-2xl border border-border/60 bg-card h-full flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                    04
                  </div>
                  <Zap size={20} className="text-muted-foreground" />
                </div>
                <h3 className="text-base font-bold mb-2 text-foreground">Launch &amp; Get Feedback</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Share your live project with the community. Get honest, helpful feedback from students who understand what you&apos;re building.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-border/40 text-[11px] font-semibold text-primary flex items-center gap-1">
                <span>Honest feedback from builders</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── 5. COMMUNITY DISCOVERY SHOWCASE ── */}
      <section id="showcase" className="py-20 border-t border-border/50 bg-secondary/20 relative z-10 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-primary tracking-widest uppercase px-3 py-1 rounded-md bg-primary/10 border border-primary/20">
                LIVE ECOSYSTEM
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mt-3">
                Meet your next technical co-founder.
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-md mt-2 md:mt-0">
              Real students building real software layers. Browse high signal portfolios sorted by engineering skills and execution stages.
            </p>
          </div>

          {/* Preview Showcase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleBuilders.map((builder, idx) => (
              <Card key={idx} className="p-6 rounded-2xl border border-border/60 hover:border-border hover:shadow-md transition-all flex flex-col justify-between bg-card">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{builder.name}</h3>
                      <p className="text-xs text-primary font-medium">{builder.role}</p>
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/60">
                      {builder.college}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">What they&apos;re building</p>
                    <p className="text-xs font-medium leading-snug text-foreground">
                      &ldquo;{builder.idea}&rdquo;
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {builder.tags.map((t, i) => (
                      <span key={i} className="text-[10px] bg-secondary/80 px-2 py-0.5 rounded font-mono text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    {builder.status}
                  </span>
                  <Link href="/signup">
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-primary hover:bg-primary/10">
                      <span>Connect</span>
                      <ChevronRight size={12} className="ml-0.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/signup">
              <Button variant="outline" className="rounded-xl border-border/80 text-xs font-semibold px-6 h-11 hover:bg-secondary">
                <span>Browse all verified builders</span>
                <ArrowRight size={14} className="ml-1.5 text-muted-foreground" />
              </Button>
            </Link>
          </div>

        </div>
      </section>

      {/* ── 6. AI ASSISTANT SHOWCASE ── */}
      <section id="ai-partner" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10 scroll-mt-20">
        <div className="p-8 sm:p-12 rounded-3xl bg-card border border-border/80 shadow-xl relative overflow-hidden">
          
          <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-primary/5 filter blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-secondary text-xs font-bold text-foreground border border-border/60">
                <Cpu size={14} className="text-primary" />
                <span>AI BUILDER PARTNER</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Meet your built-in AI brainstorming partner.
              </h2>
              
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Stuck on tech decisions or idea validation? Our AI assistant is right there in your clan workspace to help you unblock yourself and keep shipping.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-primary/10 text-primary mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <p className="text-xs text-foreground font-medium">
                    <strong className="text-primary">Instant tech checks:</strong> Validate your stack before spending sleepless weekends coding.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-primary/10 text-primary mt-0.5">
                    <CheckCircle2 size={14} />
                  </div>
                  <p className="text-xs text-foreground font-medium">
                    <strong className="text-primary">Break down features:</strong> Turn messy startup ideas into clear, step-by-step tasks.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Mockup Widget */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-background border border-border/60 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2 border-b border-border/40 font-mono">
                  <Cpu size={14} className="text-primary" />
                  <span>SkoAssistant AI</span>
                </div>
                
                {/* User message block */}
                <div className="p-3 rounded-lg bg-secondary text-xs text-foreground leading-relaxed border border-border/40">
                  <span className="font-semibold text-primary text-[10px] block mb-1">YOU</span>
                  &ldquo;Should we build custom auth or just use Supabase for our MVP?&rdquo;
                </div>

                {/* AI response block */}
                <div className="p-3 rounded-lg bg-primary/5 text-xs text-foreground leading-relaxed border border-primary/10">
                  <span className="font-semibold text-primary text-[10px] block mb-1 flex items-center gap-1">
                    <span>SKO-AI</span>
                    <Sparkles size={10} />
                  </span>
                  Stick to native Supabase. Don&apos;t waste time over-engineering custom auth right now. Ship the core feature first and get it in front of users.
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 7. ACCOUNTABILITY/CLAN SYSTEM SECTION ── */}
      <section className="py-20 border-t border-border/50 bg-background relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
              ACCOUNTABILITY
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Don&apos;t build alone. Stay on track with your clan.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ClanSko replaces messy group chats with simple weekly goals. Your clan sees your progress, helps you when you&apos;re stuck, and keeps you accountable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-secondary/40 border border-border/60 text-center space-y-2">
              <p className="text-xl font-bold text-primary">Monday Goals</p>
              <p className="text-xs text-muted-foreground">Set 3 important tasks to focus on for the week.</p>
            </div>
            <div className="p-6 rounded-2xl bg-secondary/40 border border-border/60 text-center space-y-2">
              <p className="text-xl font-bold text-foreground">Mid-Week Sync</p>
              <p className="text-xs text-muted-foreground">Help each other out, review code, and share honest feedback.</p>
            </div>
            <div className="p-6 rounded-2xl bg-secondary/40 border border-border/60 text-center space-y-2">
              <p className="text-xl font-bold text-primary">Sunday Wrap-up</p>
              <p className="text-xs text-muted-foreground">Share what you shipped. Build your streak and celebrate wins together.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. ARTICLES / INSIGHTS SECTION ── */}
      <section className="py-20 border-t border-border/50 bg-secondary/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
                READS FOR BUILDERS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-2">
                Helpful Guides to Build &amp; Launch
              </h2>
            </div>
            <div className="hidden sm:block">
              <span className="text-xs text-muted-foreground font-mono">Written by student builders who&apos;ve been there</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((art, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border/60 bg-card hover:border-border transition-all flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="text-primary font-bold uppercase">{art.category}</span>
                    <span>{art.readTime}</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>
                <div className="pt-4 mt-6 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Read Guide</span>
                  <BookOpen size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 9. TESTIMONIALS / COMMUNITY VOICES ── */}
      <section className="py-20 border-t border-border/50 bg-background relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold text-primary tracking-widest uppercase px-3 py-1 rounded-md bg-primary/10 border border-primary/20">
            WALL OF LOVE
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-4 mb-12">
            What student builders are saying.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
            <Card className="p-6 rounded-2xl border-border/60 bg-card space-y-4">
              <Quote size={24} className="text-primary/40" />
              <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
                &ldquo;ClanSko changed everything for me. Instead of just stressing over placements and packages, I teamed up with a developer from IIT Guwahati. We shipped our AI revision platform in just 12 days.&rdquo;
              </p>
              <div className="pt-2 border-t border-border/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs border border-border">
                  KV
                </div>
                <div>
                  <p className="text-xs font-bold leading-none">Kunal Verma</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Builder • DTU</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-2xl border-border/60 bg-card space-y-4">
              <Quote size={24} className="text-primary/40" />
              <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">
                &ldquo;The weekly streaks feature is the ultimate cure for procrastination. Setting goals publicly on Monday makes sure you actually ship something cool before Sunday night.&rdquo;
              </p>
              <div className="pt-2 border-t border-border/40 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs border border-border">
                  SP
                </div>
                <div>
                  <p className="text-xs font-bold leading-none">Shruti Patil</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Builder • COEP</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 10. FINAL CTA SECTION ── */}
      <section className="py-20 md:py-32 border-t border-border/50 bg-secondary/30 relative z-10 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="w-12 h-1 bg-primary rounded-full inline-block mb-2" />
          
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Find your builder circle today.
          </h2>
          
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Stop waiting for the perfect time to build. The best time to start working on your ideas with ambitious students is right now.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="rounded-xl px-8 h-12 text-base font-semibold shadow-md shadow-primary/20">
                <span>Join ClanSko — It&apos;s Free</span>
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" className="rounded-xl px-6 h-12 text-sm font-medium">
                Already registered? Sign in
              </Button>
            </Link>
          </div>

          <p className="text-[11px] text-muted-foreground pt-4 font-mono">
            For college students and builders. No passive scrolling, just pure building.
          </p>
        </div>
      </section>

      {/* ── 11. PREMIUM FOOTER ── */}
      <footer className="border-t border-border bg-card py-12 text-xs text-muted-foreground relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-border/60">
            
            {/* Column 1: Brand Info */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">
                  C
                </div>
                <span className="font-bold text-foreground text-sm tracking-tight">ClanSko</span>
              </div>
              <p className="text-xs leading-relaxed max-w-xs">
                A premium community platform built to help Indian college students stop planning alone and start shipping code together.
              </p>
            </div>

            {/* Column 2: Architecture */}
            <div className="space-y-2">
              <p className="font-bold text-foreground tracking-wide uppercase text-[11px]">Platform</p>
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/feed" className="hover:text-foreground transition-colors">Live Feed</Link>
                <Link href="/explore" className="hover:text-foreground transition-colors">Explore Builders</Link>
                <Link href="/goals" className="hover:text-foreground transition-colors">Weekly Goals</Link>
              </div>
            </div>

            {/* Column 3: Authorization */}
            <div className="space-y-2">
              <p className="font-bold text-foreground tracking-wide uppercase text-[11px]">Account</p>
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/login" className="hover:text-foreground transition-colors">Log In</Link>
                <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
              </div>
            </div>

            {/* Column 4: Principles */}
            <div className="space-y-2">
              <p className="font-bold text-foreground tracking-wide uppercase text-[11px]">Our Vibe</p>
              <p className="text-[11px] leading-relaxed italic text-muted-foreground/80 pt-1">
                &ldquo;Build cool stuff. Support each other. Keep shipping.&rdquo;
              </p>
            </div>

          </div>

          {/* Bottom Copyright Strip */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px]">
              &copy; {new Date().getFullYear()} ClanSko. Built by students, for ambitious students.
            </p>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="hover:text-foreground transition-colors cursor-pointer">Privacy</span>
              <span>•</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Guidelines</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  )
}