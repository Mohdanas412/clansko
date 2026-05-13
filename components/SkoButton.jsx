// components/SkoButton.jsx
// Redesigned Floating Copilot Action Trigger — Hybrid Premium Community SaaS theme

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Cpu } from 'lucide-react'
import SkoChat from './SkoChat'
import { cn } from '@/lib/utils'

export default function SkoButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Ambient Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center"
          >
            {/* Outer persistent pulse decorative glow ring */}
            <div className="absolute -inset-1.5 rounded-full bg-primary/20 animate-pulse pointer-events-none" />

            <button
              onClick={() => setIsOpen(true)}
              className={cn(
                "relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all duration-200 group font-sans border border-primary/20"
              )}
            >
              {/* Dynamic Copilot badge icon container */}
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:rotate-12 transition-transform duration-200">
                <Sparkles size={13} className="fill-white/10" />
              </div>

              {/* Responsive CTA label */}
              <div className="flex flex-col text-left">
                <span className="leading-none font-bold text-xs tracking-wide">Ask Sko AI</span>
                <span className="text-[9px] text-white/80 font-medium leading-none mt-0.5 block hidden sm:block">Builder Copilot</span>
              </div>

              {/* Status micro-dot indicator */}
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5 hidden sm:inline-block" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Assistant Chat Sidebar / Drawer layer */}
      <SkoChat isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}