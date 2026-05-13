// components/Skeleton.jsx
// Reusable skeleton loading components
// Modernized: Hybrid Premium Community SaaS theme adaptive shimmer support

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// ── Base shimmer animation block ──
function SkeletonBlock({ className, width, height, borderRadius = '0.5rem', style = {} }) {
  return (
    <div
      className={cn(
        "bg-secondary/60 relative overflow-hidden",
        className
      )}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-background/60 to-transparent" />
    </div>
  )
}

// ── Global Shimmer Keyframes Injector ──
function ShimmerStyle() {
  return (
    <style>{`
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
    `}</style>
  )
}

// ── Feed post card skeleton ──
export function PostCardSkeleton() {
  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card space-y-4 shadow-sm relative overflow-hidden">
      <ShimmerStyle />

      {/* Creator Identity Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SkeletonBlock width="40px" height="40px" borderRadius="0.75rem" className="shrink-0" />
          <div className="space-y-1.5">
            <SkeletonBlock width="130px" height="14px" />
            <SkeletonBlock width="180px" height="10px" />
          </div>
        </div>
        <SkeletonBlock width="70px" height="22px" borderRadius="999px" />
      </div>

      {/* Blueprint Title Preview */}
      <div className="space-y-2 pt-1">
        <SkeletonBlock width="85%" height="16px" />
        <SkeletonBlock width="40%" height="16px" />
      </div>

      {/* Description Body Paragraph preview */}
      <div className="space-y-1.5 pt-1">
        <SkeletonBlock width="100%" height="12px" />
        <SkeletonBlock width="95%" height="12px" />
        <SkeletonBlock width="70%" height="12px" />
      </div>

      {/* Interactive Toolbar row preview */}
      <div className="flex items-center justify-between pt-4 border-t border-border/40">
        <div className="flex items-center gap-2">
          <SkeletonBlock width="54px" height="26px" borderRadius="0.5rem" />
          <SkeletonBlock width="54px" height="26px" borderRadius="0.5rem" />
          <SkeletonBlock width="54px" height="26px" borderRadius="0.5rem" />
        </div>
        <SkeletonBlock width="48px" height="26px" borderRadius="0.5rem" />
      </div>
    </div>
  )
}

// ── Explore user card skeleton ──
export function UserCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-border/80 bg-card space-y-4 shadow-sm">
      <ShimmerStyle />

      <div className="flex gap-3 items-start">
        <SkeletonBlock width="48px" height="48px" borderRadius="50%" className="shrink-0" />
        <div className="space-y-1.5 flex-1">
          <SkeletonBlock width="140px" height="16px" />
          <SkeletonBlock width="100px" height="12px" />
          <SkeletonBlock width="120px" height="12px" />
        </div>
      </div>

      <div className="space-y-1.5">
        <SkeletonBlock width="100%" height="12px" />
        <SkeletonBlock width="80%" height="12px" />
      </div>

      <div className="flex gap-1.5 flex-wrap pt-1">
        <SkeletonBlock width="60px" height="20px" borderRadius="999px" />
        <SkeletonBlock width="75px" height="20px" borderRadius="999px" />
        <SkeletonBlock width="50px" height="20px" borderRadius="999px" />
      </div>

      <SkeletonBlock width="100%" height="36px" borderRadius="0.75rem" className="mt-2" />
    </div>
  )
}

// ── Messages inbox item skeleton ──
export function MessageItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/40 mb-1 shadow-xs">
      <ShimmerStyle />
      <SkeletonBlock width="44px" height="44px" borderRadius="50%" className="shrink-0" />
      <div className="space-y-1.5 flex-1">
        <div className="flex justify-between items-center">
          <SkeletonBlock width="110px" height="14px" />
          <SkeletonBlock width="40px" height="10px" />
        </div>
        <SkeletonBlock width="190px" height="12px" />
      </div>
    </div>
  )
}

// ── Goals page skeleton ──
export function GoalsSkeleton() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <ShimmerStyle />
      
      <div className="space-y-2">
        <SkeletonBlock width="180px" height="28px" />
        <SkeletonBlock width="240px" height="12px" />
      </div>

      <SkeletonBlock width="100%" height="6px" borderRadius="999px" className="my-6" />

      <div className="space-y-3">
        <div className="p-4 rounded-xl border border-border/60 bg-card flex items-center gap-3">
          <SkeletonBlock width="20px" height="20px" borderRadius="0.35rem" className="shrink-0" />
          <SkeletonBlock width="75%" height="14px" />
        </div>
        <div className="p-4 rounded-xl border border-border/60 bg-card flex items-center gap-3">
          <SkeletonBlock width="20px" height="20px" borderRadius="0.35rem" className="shrink-0" />
          <SkeletonBlock width="50%" height="14px" />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border/80 bg-secondary/20 space-y-2 mt-4">
        <SkeletonBlock width="90px" height="12px" />
        <div className="flex gap-2">
          <SkeletonBlock width="100%" height="38px" borderRadius="0.75rem" />
          <SkeletonBlock width="70px" height="38px" borderRadius="0.75rem" className="shrink-0" />
        </div>
      </div>
    </div>
  )
}