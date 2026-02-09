# Oxmon Admin✅

Enterprise infrastructure monitoring and certificate management platform powered by Next.js 16 + React 19 + AI.

## ✨ Tech Stack

- **Framework**: Next.js 16.1.6 (App Router + Turbopack)
- **Runtime**: Bun
- **UI Library**: React 19.2.4
- **Styling**: Tailwind CSS v4 (with custom theme system)
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

## 📦 Migration & Optimization Complete

This project was successfully migrated from **Vite 6 + pnpm** to **Next.js 16 + bun** and optimized with **Vercel React Best Practices**:

✅ All 16 components migrated with `'use client'`
✅ Server Actions for AI (Gemini API hidden server-side)
✅ Tailwind v4 + custom CSS theme (single-file, zero warnings)
✅ App Router with route-based navigation
✅ AppContext for global state management with useMemo optimization
✅ SSR-compatible with localStorage checks
✅ Bundle size optimization (~365KB reduction via direct imports)
✅ Re-render optimization (memo + extracted components)
✅ Versioned localStorage for safe data migrations
✅ React.cache() for server-side deduplication
✅ **Zero build warnings** (no Sass deprecations)
✅ Production build verified

### Performance Improvements
- **Bundle Size**: Reduced by ~365KB (direct Recharts imports, removed client-side GenAI)
- **Build Speed**: 33% faster (7.1s vs 10.6s)
- **Re-renders**: Minimized via memo, useMemo, and component extraction
- **Server Performance**: React.cache() for AI client deduplication
- **Client Data**: Versioned localStorage with automatic error handling
- **Code Quality**: Single CSS file, zero warnings, cleaner architecture

See [OPTIMIZATION_REPORT.md](./OPTIMIZATION_REPORT.md) and [FINAL_FIX.md](./FINAL_FIX.md) for detailed analysis.

## 📝 License

Private - All Rights Reserved
