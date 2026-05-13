'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  X, 
  Sparkles, 
  User, 
  GraduationCap, 
  Terminal, 
  Compass, 
  CheckCircle2,
  Rocket,
  Users,
  Award,
  Zap,
  Eye
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export default function OnboardingPage() {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Core Form variables
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [lookingFor, setLookingFor] = useState('');

  useEffect(() => {
    async function checkAuth() {
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

      if (userData?.onboarding_done) {
        router.push('/feed');
        return;
      }

      setCurrentUser(user);
      setLoading(false);
    }

    checkAuth();
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

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim() || !college.trim() || !branch.trim() || !year) {
        toast.error('Please fill in all details');
        return;
      }
    }
    if (step === 2) {
      if (!bio.trim()) {
        toast.error('Tell us a bit about yourself');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!lookingFor) {
      toast.error('Please select what you are looking for');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Session expired. Please log in again.');
        router.push('/login');
        return;
      }

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
          looking_for: [lookingFor],
          onboarding_done: true
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Profile created! Welcome to ClanSko.');
        window.location.href = '/feed';
      } else {
        console.error('API Error:', result);
        toast.error(result.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Network error. Please try again.');
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="space-y-3 text-center animate-in fade-in duration-300">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-mono">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const LOOKING_FOR_OPTIONS = [
    { value: 'Co-founder', icon: Rocket, title: 'Find a Co-founder', desc: 'Looking for a dev or product builder to partner up and launch an idea.' },
    { value: 'Collaborator', icon: Users, title: 'Project Collaborators', desc: 'Want to team up for hackathons, side projects, or learn together.' },
    { value: 'Mentor', icon: Award, title: 'Guidance & Mentorship', desc: 'Looking for senior students or alumni to review code and give advice.' },
    { value: 'Accountability Partner', icon: Zap, title: 'Accountability Partner', desc: 'Want someone to share weekly goals with and make sure we both ship code.' },
    { value: 'Just Exploring', icon: Eye, title: 'Just Exploring', desc: 'Checking out what others are building and getting inspired.' }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-background relative overflow-y-auto">
      
      {/* Decorative top background radial glow */}
      <div className="absolute top-[-100px] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl space-y-6 relative z-10 my-auto py-8">
        
        {/* ── HEADER IDENTIFIER LOGO ── */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold font-mono tracking-wide uppercase">
              GETTING STARTED
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Set Up Your Profile
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Tell us about yourself and what you&apos;re building to connect with the right people.
          </p>
        </div>

        {/* ── ELEGANT PROGRESS STRIP ── */}
        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="space-y-1">
                <div 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    s < step ? "bg-primary" : s === step ? "bg-primary" : "bg-secondary"
                  )} 
                />
                <span className={cn(
                  "text-[9px] font-mono tracking-wider uppercase block text-center font-bold",
                  s <= step ? "text-foreground" : "text-muted-foreground/60"
                )}>
                  {s === 1 ? 'Basics' : s === 2 ? 'Skills' : 'Goals'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CARD CANVAS MODULE ── */}
        <Card className="p-6 sm:p-8 rounded-3xl border-border bg-card shadow-sm space-y-6 relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block font-mono">
                    Step 1 of 3
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                    College & Background
                  </h2>
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
                      placeholder="e.g. Aman Gupta"
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
                      placeholder="e.g. IIT Bombay, BITS Pilani, DTU"
                      className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-foreground tracking-wide">
                        Branch / Degree *
                      </label>
                      <input
                        type="text"
                        required
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="e.g. Computer Science, BCA, IT"
                        className="w-full h-11 px-3.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all font-sans"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-foreground tracking-wide">
                        Cohort Class Year *
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
                        <option value="5">Graduate / Alumnus</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <Button
                    onClick={handleNext}
                    className="w-full rounded-xl h-11 text-xs font-bold"
                  >
                    <span>Next: Your Skills & Vibe</span>
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block font-mono">
                    Step 2 of 3
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                    Bio & Tech Stack
                  </h2>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground tracking-wide">
                      Short Bio / What are you building? *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="What are you working on? What tech do you love? Keep it casual and real."
                      className="w-full p-3.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-all font-sans resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-foreground tracking-wide">
                        Top Skills / Tech Stack
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
                        placeholder="e.g. React, Python, Figma, Node.js"
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
                          <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/5 text-primary border border-primary/20 text-xs font-medium">
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

                <div className="flex gap-3 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="w-1/3 rounded-xl h-11 text-xs font-bold"
                  >
                    <ArrowLeft size={14} className="mr-1.5" />
                    <span>Back</span>
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1 rounded-xl h-11 text-xs font-bold"
                  >
                    <span>Next: What are you looking for?</span>
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block font-mono">
                    Final Step
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                    What brings you to ClanSko?
                  </h2>
                </div>

                <div className="space-y-2.5 pt-1 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                  {LOOKING_FOR_OPTIONS.map((opt) => {
                    const isSelected = lookingFor === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setLookingFor(opt.value)}
                        className={cn(
                          "w-full p-3.5 rounded-xl border text-left transition-all duration-150 flex items-start gap-3 outline-none",
                          isSelected 
                            ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/10" 
                            : "bg-background border-border/80 hover:bg-secondary/40"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                          isSelected ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                        )}>
                          <Icon size={15} />
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-xs font-bold tracking-tight block",
                              isSelected ? "text-primary" : "text-foreground"
                            )}>
                              {opt.title}
                            </span>
                            {isSelected && <span className="text-[10px] text-primary font-mono font-bold">Selected</span>}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed font-normal">
                            {opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-3 border-t border-border/60">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={submitting}
                    className="w-1/3 rounded-xl h-11 text-xs font-bold"
                  >
                    <ArrowLeft size={14} className="mr-1.5" />
                    <span>Back</span>
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 rounded-xl h-11 text-xs font-bold shadow-xs hover:shadow-sm"
                  >
                    <Sparkles size={13} className="mr-1.5 text-primary-foreground" />
                    <span>{submitting ? 'Saving profile...' : 'Go to Live Feed'}</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </Card>

      </div>

    </div>
  );
}