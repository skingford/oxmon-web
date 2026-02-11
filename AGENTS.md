# Repository Guidelines

## Project Structure & Module Organization
- Source code lives in `src/`.
- App Router pages are in `src/app/`, including locale-based routes under `src/app/[locale]/...`.
- Shared UI components are in `src/components/ui` (shadcn-style primitives).
- Feature/domain components are in `src/components/features` and `src/components/pages`.
- Server actions live in `src/actions`; shared utilities and i18n helpers are in `src/lib`.
- Context providers are in `src/contexts`; middleware is in `middleware.ts`.
- Product/design documentation is in `docs/`.

## Build, Test, and Development Commands
- `npm run dev` — run local dev server with Turbopack.
- `npm run build` — production build.
- `npm run build -- --webpack` — webpack build fallback (useful for debugging Turbopack-only issues).
- `npm run start` — serve built app.
- `bunx --bun shadcn@latest add <component>` — add/update shadcn components (for example: `tabs`, `table`, `pagination`).

## Coding Style & Naming Conventions
- Language: TypeScript + React (Next.js App Router).
- Indentation: 2 spaces; prefer semicolon-free style to match existing files.
- Components: PascalCase file/component names (for example, `OxmonSslCertificateStatus.tsx`).
- Hooks/util functions: camelCase.
- Keep UI consistent with tokens in `src/app/globals.css` and product spec in `docs/product-design-spec.md`.
- Reuse `src/components/ui/*` primitives before creating new base UI elements.

## Testing Guidelines
- No dedicated test runner is currently configured.
- Minimum validation for changes:
  - `npm run build -- --webpack`
  - manual smoke-check of affected routes in `npm run dev`.
- If adding tests, colocate them near changed modules and use descriptive names (`*.test.ts[x]`).

## Commit & Pull Request Guidelines
- Follow Conventional Commit style used in history (`feat:`, `fix:`, `refactor:`).
- Keep commits scoped and atomic; avoid mixing unrelated refactors.
- PRs should include:
  - clear summary and impacted routes/components,
  - screenshots/GIFs for UI changes,
  - validation notes (build command and result),
  - linked issue/task if applicable.

## Security & Configuration Tips
- Never commit secrets. Use `.env.local` for local keys (see `.env.example`).
- Validate server-side action inputs and handle external API JSON parsing defensively.

## requirement

- 响应用中文回复
