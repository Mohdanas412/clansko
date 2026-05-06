// app/components/Skeleton.jsx
// Reusable skeleton loading components
// Used on Feed, Explore, Messages instead of plain "Loading..." text

'use client'

// ── Base shimmer animation ──
// This is the pulsing grey block that simulates content loading
function SkeletonBlock({ width = '100%', height = '16px', borderRadius = '6px', style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#1e2a4a',
        backgroundImage: 'linear-gradient(90deg, #1e2a4a 0%, #2a3a5a 50%, #1e2a4a 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  )
}

// ── Shimmer keyframe — injected once into the page ──
function ShimmerStyle() {
  return (
    <style>{`
      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  )
}

// ── Feed post card skeleton ──
export function PostCardSkeleton() {
  return (
    <div style={{
      backgroundColor: '#16213e',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '16px',
      border: '1px solid #1e2a4a',
    }}>
      <ShimmerStyle />

      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <SkeletonBlock width="36px" height="36px" borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <SkeletonBlock width="140px" height="14px" />
          <SkeletonBlock width="200px" height="12px" />
        </div>
        <SkeletonBlock width="70px" height="24px" borderRadius="20px" />
      </div>

      {/* Title */}
      <SkeletonBlock width="80%" height="16px" style={{ marginBottom: '8px' }} />

      {/* Description lines */}
      <SkeletonBlock width="100%" height="14px" style={{ marginBottom: '6px' }} />
      <SkeletonBlock width="90%" height="14px" style={{ marginBottom: '6px' }} />
      <SkeletonBlock width="60%" height="14px" style={{ marginBottom: '14px' }} />

      {/* Reaction buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <SkeletonBlock width="70px" height="32px" borderRadius="8px" />
        <SkeletonBlock width="70px" height="32px" borderRadius="8px" />
        <SkeletonBlock width="70px" height="32px" borderRadius="8px" />
        <SkeletonBlock width="60px" height="32px" borderRadius="8px" style={{ marginLeft: 'auto' }} />
      </div>
    </div>
  )
}

// ── Explore user card skeleton ──
export function UserCardSkeleton() {
  return (
    <div style={{
      backgroundColor: '#16213e',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #2a2a4a',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <ShimmerStyle />

      {/* Avatar + name row */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <SkeletonBlock width="48px" height="48px" borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <SkeletonBlock width="140px" height="18px" />
          <SkeletonBlock width="100px" height="13px" />
          <SkeletonBlock width="120px" height="13px" />
        </div>
      </div>

      {/* Bio lines */}
      <SkeletonBlock width="100%" height="14px" />
      <SkeletonBlock width="85%" height="14px" />

      {/* Skill chips */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <SkeletonBlock width="70px" height="24px" borderRadius="999px" />
        <SkeletonBlock width="90px" height="24px" borderRadius="999px" />
        <SkeletonBlock width="60px" height="24px" borderRadius="999px" />
      </div>

      {/* Connect button */}
      <SkeletonBlock width="100%" height="40px" borderRadius="8px" />
    </div>
  )
}

// ── Messages inbox item skeleton ──
export function MessageItemSkeleton() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      backgroundColor: '#16213e',
      borderRadius: '12px',
      marginBottom: '2px',
    }}>
      <ShimmerStyle />

      {/* Avatar */}
      <SkeletonBlock width="48px" height="48px" borderRadius="50%" />

      {/* Name + preview */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <SkeletonBlock width="120px" height="15px" />
          <SkeletonBlock width="50px" height="12px" />
        </div>
        <SkeletonBlock width="220px" height="13px" />
        <SkeletonBlock width="80px" height="12px" />
      </div>
    </div>
  )
}
// ── Goals page skeleton ──
export function GoalsSkeleton() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f1a',
      padding: '40px 24px',
    }}>
      <ShimmerStyle />
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <SkeletonBlock width="200px" height="32px" style={{ marginBottom: '8px' }} />
          <SkeletonBlock width="240px" height="15px" />
        </div>

        {/* Progress bar */}
        <SkeletonBlock width="100%" height="6px" borderRadius="999px" style={{ marginBottom: '40px' }} />

        {/* Goal items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          <div style={{
            backgroundColor: '#16213e',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            border: '1px solid #2a2a4a',
          }}>
            <SkeletonBlock width="22px" height="22px" borderRadius="6px" />
            <SkeletonBlock width="70%" height="16px" />
          </div>
          <div style={{
            backgroundColor: '#16213e',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            border: '1px solid #2a2a4a',
          }}>
            <SkeletonBlock width="22px" height="22px" borderRadius="6px" />
            <SkeletonBlock width="50%" height="16px" />
          </div>
        </div>

        {/* Add goal input skeleton */}
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #2a2a4a',
        }}>
          <SkeletonBlock width="100px" height="13px" style={{ marginBottom: '12px' }} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <SkeletonBlock width="100%" height="42px" borderRadius="8px" />
            <SkeletonBlock width="80px" height="42px" borderRadius="8px" />
          </div>
        </div>

      </div>
    </div>
  )
}