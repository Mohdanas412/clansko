// app/(app)/layout.jsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Compass, 
  MessageSquare, 
  Target, 
  FolderGit2, 
  UserCircle, 
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import SkoButton from '@/components/SkoButton'

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navigation = [
    { name: 'Feed', href: '/feed', icon: LayoutDashboard },
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Projects', href: '/projects', icon: FolderGit2 },
    { name: 'Profile', href: '/profile', icon: UserCircle },
  ]

  // Close mobile menu on navigate
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-background flex font-sans overflow-hidden selection:bg-primary/20">
      
      {/* ── DESKTOP SIDEBAR ── */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className={cn(
          "hidden md:flex flex-col h-screen bg-card border-r sticky top-0 left-0 shrink-0 z-20 transition-all duration-300",
        )}
      >
        {/* Logo Area */}
        <div className="h-[72px] flex items-center px-6 border-b border-border/60">
          <Link href="/feed" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105 group-active:scale-95">
              <span className="font-bold text-white text-sm">C</span>
            </div>
            <AnimatePresence initial={false}>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-semibold tracking-tight text-lg whitespace-nowrap"
                >
                  ClanSko
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1 custom-scrollbar">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            
            return (
              <Link key={item.name} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center gap-3 px-3 h-11 rounded-xl transition-all group cursor-pointer relative",
                    isActive 
                      ? "bg-primary/5 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center",
                    !isSidebarOpen && "w-full mx-auto"
                  )}>
                    <Icon 
                      size={20} 
                      strokeWidth={isActive ? 2 : 1.8} 
                      className={cn(
                        "transition-transform group-hover:scale-105",
                        isActive && "text-primary"
                      )} 
                    />
                  </div>
                  
                  <AnimatePresence initial={false}>
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="whitespace-nowrap overflow-hidden text-[14px]"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {isActive && isSidebarOpen && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                    />
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Sidebar Bottom */}
        <div className="p-3 border-t border-border/60 mt-auto">
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 h-11 rounded-xl text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all group cursor-pointer",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut size={18} strokeWidth={1.8} className="group-hover:-translate-x-0.5 transition-transform" />
            {isSidebarOpen && <span className="text-[14px]">Logout</span>}
          </button>
        </div>
        
        {/* Collapse toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-[76px] -right-3 w-6 h-6 bg-background border rounded-full flex items-center justify-center shadow-sm hover:bg-muted text-muted-foreground transition-colors z-30"
        >
          <motion.div
            animate={{ rotate: isSidebarOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronRight size={12} />
          </motion.div>
        </button>
      </motion.aside>

      {/* ── MAIN LAYOUT WRAPPER ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden h-screen bg-background relative">
        
        {/* ── TOPBAR ── */}
        <header className="h-[72px] border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden rounded-xl"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </Button>
            
            {/* Contextual Page Title (Optional but nice) */}
            <div className="hidden sm:flex items-center">
             <h1 className="text-lg font-semibold capitalize">
             {pathname.split('/').filter(Boolean)[0] || 'Dashboard'}
             </h1>
           </div>
          </div>
          
          {/* User Area Right Side Topbar */}
          <div className="flex items-center gap-3">
             <Link href="/profile">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border overflow-hidden hover:border-primary/50 transition-colors">
                   <UserCircle size={20} className="text-muted-foreground" />
                </div>
             </Link>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* This max-w-7xl creates a better contained content feel, but allows components outside to break if they need */}
          <div className="mx-auto w-full max-w-7xl p-4 md:p-8 pb-24 md:pb-8 animate-in fade-in duration-500">
            {children}
          </div>
        </main>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/60 h-16 px-2 flex items-center justify-around z-40 pb-safe">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link key={item.name} href={item.href} className="flex-1">
                <div className={cn(
                  "flex flex-col items-center justify-center gap-1 h-full w-full transition-all relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  <div className={cn(
                    "p-1 rounded-lg transition-colors",
                    isActive && "bg-primary/10"
                  )}>
                     <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium tracking-wide",
                    isActive ? "opacity-100" : "opacity-70"
                  )}>
                    {item.name}
                  </span>
                  {isActive && (
                    <motion.div layoutId="mobTab" className="absolute -bottom-1.5 w-8 h-1 bg-primary rounded-full" />
                  )}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* ── MOBILE SIDEBAR OVERLAY / DRAWER ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
            />
            
            {/* Sidebar Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-card border-r z-50 flex flex-col md:hidden shadow-xl shadow-black/5"
            >
              <div className="h-[72px] flex items-center justify-between px-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                    <span className="font-bold text-white text-sm">C</span>
                  </div>
                  <span className="font-semibold text-lg">ClanSko</span>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={18} />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
                 {navigation.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  const Icon = item.icon
                  return (
                    <Link key={item.name} href={item.href}>
                      <div 
                        className={cn(
                          "flex items-center gap-4 px-4 h-12 rounded-xl transition-all",
                          isActive 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon size={20} strokeWidth={isActive ? 2 : 1.8} />
                        <span className="text-[15px]">{item.name}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
              
              <div className="p-4 border-t border-border/60 mt-auto pb-8">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 h-12 rounded-xl text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all"
                >
                  <LogOut size={20} />
                  <span className="text-[15px]">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── TOASTER ── */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '1rem',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: 'hsl(var(--primary))',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* ── AI SKO BUTTON ── */}
      <SkoButton />
    </div>
  )
}