# Oxmon Admin - Next.js Migration ✅

Enterprise infrastructure monitoring and certificate management platform powered by Next.js 16 + React 19 + AI.

## ✨ Tech Stack

- **Framework**: Next.js 16.1.6 (App Router + Turbopack)
- **Runtime**: Bun
- **UI Library**: React 19.2.4
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts 3.7.0
- **AI**: Google Gemini API (GenAI SDK 1.40.0)
- **TypeScript**: 5.8.2

## 📁 Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Redirects to /dashboard
│   ├── globals.css              # Tailwind v4 + custom theme
│   ├── login/                   # Login page
│   └── (dashboard)/             # Protected routes
│       ├── layout.tsx           # Dashboard layout
│       └── [dashboard pages]    # 9 route pages
├── components/                   # 16 React components
├── contexts/                     # AppContext (state)
├── actions/                      # Server Actions (AI)
└── lib/                          # Types & constants
```

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Add your GEMINI_API_KEY
   ```

3. **Run development**:
   ```bash
   bun run dev
   # Open http://localhost:3000
   ```

4. **Build for production**:
   ```bash
   bun run build
   bun run start
   ```

## 🎯 Features

- 🖥️ **Agent Management** - Remote terminal, telemetry charts
- 🔒 **Certificate Management** - Trust analysis, lifecycle tracking
- 🌐 **Infrastructure Topology** - Mesh visualization, global map
- 🚨 **Alert Management** - Neural root-cause analysis
- 📊 **Audit Logs** - Live trace with AI-generated logs
- 🔧 **Config Forge** - IaC generator with AI hardening
- 🎤 **Live Assistant** - Voice AI (Gemini Native Audio)

## 📦 Migration Complete

This project was successfully migrated from **Vite 6 + pnpm** to **Next.js 16 + bun**:

✅ All 16 components migrated with `'use client'`
✅ Server Actions for AI (Gemini API hidden server-side)
✅ Tailwind v4 local installation (no CDN)
✅ App Router with route-based navigation
✅ AppContext for global state management
✅ SSR-compatible with localStorage checks
✅ Production build verified

## 📝 License

Private - All Rights Reserved
