# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Oxmon Admin** is an enterprise infrastructure monitoring and certificate management platform. This is a Next.js 16 application that was recently migrated from Vite 6 + pnpm to Next.js 16 + bun.

**Tech Stack:**
- Next.js 16.1.6 (App Router + Turbopack)
- React 19.2.4
- TypeScript 5.8.2
- Tailwind CSS v4 (local installation, no CDN)
- Recharts 3.7.0 (for data visualization)
- Google Gemini API (GenAI SDK 1.40.0)
- Runtime: Bun

## Common Commands

### Development
```bash
# Install dependencies
bun install

# Run development server with Turbopack
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

### Environment Setup
```bash
# Copy example env file
cp .env.example .env.local

# Required: Add your Gemini API key to .env.local
GEMINI_API_KEY=your_key_here
```

The development server runs on `http://localhost:3000` and uses Next.js 16's Turbopack for fast rebuilds.

## Architecture

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with Inter font
│   ├── page.tsx                 # Redirects to /dashboard
│   ├── globals.css              # Tailwind v4 + custom theme
│   ├── login/                   # Login page (no auth layout)
│   └── (dashboard)/             # Protected routes group
│       ├── layout.tsx           # Dashboard layout with sidebar/header
│       ├── dashboard/           # Main dashboard page
│       ├── agents/              # Agent management
│       ├── certificates/        # Certificate monitoring
│       ├── infrastructure/      # Infrastructure topology
│       ├── alerts/              # Alert management
│       ├── logs/                # Audit logs
│       ├── tools/               # Config Forge (IaC generator)
│       ├── settings/            # Settings & team management
│       └── help/                # Help center
├── components/                   # 16 React components (all 'use client')
│   ├── Sidebar.tsx              # Navigation sidebar
│   ├── Header.tsx               # Top header bar
│   ├── Toast.tsx                # Toast notifications
│   ├── LiveAssistant.tsx        # Voice AI assistant
│   ├── Dashboard.tsx            # Dashboard view logic
│   ├── Agents.tsx               # Agent management UI
│   ├── Certificates.tsx         # Certificate management UI
│   ├── Infrastructure.tsx       # Topology visualization
│   ├── Alerts.tsx               # Alert management UI
│   ├── Logs.tsx                 # Audit log viewer
│   ├── ConfigForge.tsx          # IaC generation tool
│   ├── Settings.tsx             # Settings UI
│   ├── HelpCenter.tsx           # Help documentation
│   ├── Login.tsx                # Login form
│   ├── CommandPalette.tsx       # Command palette (Cmd+K)
│   └── GlobalSearch.tsx         # Global search
├── contexts/                     # React Context providers
│   └── AppContext.tsx           # Global state management
├── actions/                      # Next.js Server Actions
│   └── ai.ts                    # All Gemini API calls
├── lib/                          # Shared utilities
│   ├── types.ts                 # TypeScript type definitions
│   └── constants.ts             # Mock data & defaults
└── styles/                       # SCSS stylesheets
    ├── globals.scss             # Main styles
    ├── _variables.scss          # SCSS variables
    ├── _mixins.scss             # SCSS mixins
    └── _animations.scss         # Animation definitions
```

### State Management

**AppContext** (`src/contexts/AppContext.tsx`) is the single source of truth for application state. It provides:

- **Core Data:** `agents`, `certificates`, `alerts`, `teamMembers`, `logs`, `preferences`
- **Authentication:** `isAuthenticated`, `setIsAuthenticated`
- **UI State:** `toasts`, `showToast()`, `removeToast()`
- **AI State:** `aiSummary`, `isAiLoading`, `logAnalysis`, `isLogAnalyzing`, `predictiveData`
- **Terminal Injection:** For voice AI to execute commands
- **Local Storage Persistence:** All state is saved to localStorage on change (SSR-safe with hydration checks)

The context is wrapped around the dashboard layout in `src/app/(dashboard)/layout.tsx`.

### Client vs Server Components

**All components are client components** (`'use client'`) due to the need for:
- State management with React Context
- Browser APIs (localStorage, window events)
- Interactive UI elements

**Server Actions** (`src/actions/ai.ts`) handle all Gemini API calls to keep the API key secure server-side. These are called from client components using Next.js Server Actions.

### AI Integration

All AI features use Google Gemini API through Server Actions in `src/actions/ai.ts`:

- `generateSystemSummary()` - Dashboard health audit
- `generateFullReport()` - Comprehensive infrastructure report
- `generatePredictiveMaintenance()` - Failure anticipation
- `interpretCommand()` - Voice command interpretation
- `executeTerminalCommand()` - Terminal simulation
- `analyzeCertificateTrust()` - Certificate security audit
- `simulateNodeFailure()` - Cascade risk analysis
- `analyzeHardwareImage()` - Physical hardware diagnostics (vision model)
- `generateConfig()` - IaC generation with optional hardening
- `searchKnowledgeBase()` - Grounded search with Google Search
- `generateLiveLog()` - AI-generated log entries
- `performGovernanceAudit()` - Security governance audit

All AI calls use structured outputs where applicable (JSON mode) and include error handling with graceful fallbacks.

### Routing

- Root `/` redirects to `/dashboard`
- `/login` - standalone login page (no dashboard layout)
- `/(dashboard)/*` - all protected routes use the dashboard layout with sidebar/header
- Dashboard layout checks authentication via AppContext

### Design System

The application follows an Apple-inspired design language (documented in `docs/product-design-spec.md`):

**Colors:**
- Primary: `#0071E3` (accent blue)
- Success: `#34C759` (green)
- Warning: `#FF9500` (orange)
- Danger: `#FF3B30` (red)
- Background: `#FBFBFD`, `#F5F5F7`
- Text: `#1D1D1F` (primary), `#6E6E73` (secondary)
- Borders: `#D2D2D7`, `#E5E5EA`

**Typography:** Inter font family, sizes 12px-32px

**Spacing:** 8px grid system (xs:4px, sm:8px, md:16px, lg:24px, xl:32px, 2xl:48px)

**Components:** Cards (12px radius), buttons (8px radius), modals (16px radius)

### Styling Approach

- **Tailwind CSS v4** is installed locally (not via CDN)
- **SCSS modules** in `src/styles/` provide custom animations, mixins, and variables
- **Inline Tailwind classes** are the primary styling method
- The app uses a custom scrollbar style (`.custom-scrollbar`)

### Data Flow

1. **Initial Load:** `AppContext` loads mock data from `lib/constants.ts`
2. **Hydration:** After client-side mount, data is loaded from localStorage
3. **Updates:** Any state change updates localStorage automatically
4. **AI Operations:** Components call Server Actions → Gemini API → Response stored in AppContext
5. **Toast Notifications:** Success/error feedback via `showToast()` from context

## Key Patterns

### Adding a New Page

1. Create route folder in `src/app/(dashboard)/[page-name]/`
2. Add `page.tsx` with the route component
3. Import and render the corresponding component from `src/components/`
4. Update sidebar navigation in `src/components/Sidebar.tsx`
5. Add route to type definitions in `src/lib/types.ts` (ViewState)

### Adding a New AI Feature

1. Add Server Action to `src/actions/ai.ts`:
   ```typescript
   'use server'
   export async function myAiFunction(input: string): Promise<string> {
     const ai = getAI()
     const response = await ai.models.generateContent({
       model: 'gemini-3-flash-preview',
       contents: 'your prompt here'
     })
     return response.text || 'fallback text'
   }
   ```

2. Add state to `AppContext.tsx` if needed
3. Call from component:
   ```typescript
   import { myAiFunction } from '@/actions/ai'

   const handleClick = async () => {
     setIsAiLoading(true)
     try {
       const result = await myAiFunction(input)
       setAiSummary(result)
     } catch (error) {
       showToast('AI request failed', 'error')
     } finally {
       setIsAiLoading(false)
     }
   }
   ```

### SSR Compatibility

Always check for client-side environment before using browser APIs:

```typescript
useEffect(() => {
  // Safe to use localStorage, window, etc.
}, [])
```

The AppContext uses an `isHydrated` flag to prevent SSR/client mismatches.

### Path Aliases

The project uses TypeScript path mapping:
- `@/*` maps to `./src/*`
- Use `import { Component } from '@/components/Component'` instead of relative paths

## Migration Notes

This project was migrated from **Vite 6 + pnpm** to **Next.js 16 + bun**:

✅ All 16 components migrated with `'use client'` directive
✅ Server Actions created for Gemini API (previously client-side)
✅ Tailwind v4 locally installed (removed CDN)
✅ App Router with route-based navigation
✅ SSR-compatible with localStorage checks
✅ Production build verified

The migration maintains the original Vite app's functionality while adding Next.js benefits like SSR, API routes, and optimized builds.

## Design Specification

The full design spec is in `docs/product-design-spec.md` (in Chinese). It defines:
- Complete color system and typography
- Component specifications (cards, tables, modals, badges)
- Page layouts and wireframes
- Interaction patterns
- Responsive behavior (desktop-first, ≥1024px)

Reference this document when building new UI components to maintain design consistency.
