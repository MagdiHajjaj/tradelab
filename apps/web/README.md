# Web dashboard

**Stack:** Next.js App Router, React, TypeScript, plain CSS, Lucide icons.

From the repository root: `npm ci`, then `npm run dev`. Open http://localhost:3000.

| Folder           | Responsibility                                                 |
| ---------------- | -------------------------------------------------------------- |
| `src/app`        | Route entry, layout metadata, favicon, global styles           |
| `src/components` | Dashboard UI, organized by visible feature                     |
| `src/lib`        | Synthetic data, order types, validation, paper account reducer |

Start at `src/app/page.tsx`, then follow `components/dashboard.tsx` into the relevant feature. `lib/paper-exchange.ts` is the single place that mutates simulated account state. Global CSS uses numbered sections for the palette, masthead, account ledger, trading tools, order activity, secondary views, and responsive layout. The interface uses paper tones, ink rules, serif headings, and orange accents.

The simulation runs locally in the browser and resets on refresh. Market data, chart history, depth, and strategy preview signals are illustrative. No requests reach a real broker or the Go gateway.

Checks from the root:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Install Playwright's Chromium first with `npx playwright install chromium`. Fonts load from Google Fonts when available and fall back to local sans-serif/monospace fonts when offline. A production build does not require fetching fonts.
