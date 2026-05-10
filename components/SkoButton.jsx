// components/SkoButton.jsx

'use client'

import { useState } from 'react'
import SkoChat from './SkoChat'

export default function SkoButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 50,
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#F97316',
          color: '#111111',
          border: 'none',
          borderRadius: '50px',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: '600',
          fontFamily: 'DM Sans, sans-serif',
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(249, 115, 22, 0.35)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#ea6c0a'
          e.currentTarget.style.boxShadow = '0 6px 32px rgba(249, 115, 22, 0.5)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#F97316'
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(249, 115, 22, 0.35)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Sko icon */}
        <span style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#111',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '700',
          color: '#F97316',
          flexShrink: 0,
        }}>
          S
        </span>

        {/* Hide text on small mobile */}
        <span className="sko-btn-text">Ask Sko</span>
      </button>

      {/* Chat Panel */}
      <SkoChat isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <style>{`
        @media (max-width: 480px) {
          .sko-btn-text { display: none; }
        }
      `}</style>
    </>
  )
}