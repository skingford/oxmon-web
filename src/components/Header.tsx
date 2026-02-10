'use client'

import React from 'react'

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-[#E5E5EA] px-6 py-4 flex items-center justify-between">
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h2>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Notifications"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>

        <div className="h-4 w-px bg-slate-300" />
        <span className="text-sm text-slate-500 font-medium">v0.1.0</span>
      </div>
    </header>
  )
}

export default Header
