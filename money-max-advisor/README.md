# Ledgerline (Money Max–style advisor)

Self-hosted cash-flow / debt-timing advisor designed to run with **Firefly III** + **SimpleFIN**.

## Safety
- Bank/account access is **read-only**
- No automatic bill pay — you **approve or execute** every action

## Stack
- `apps/web` — React + Vite GUI (Ledgerline)
- `apps/api` — Fastify API + interest-timing action plan engine (demo mode)
- `packages/shared` — shared TypeScript types

## Quick start
```bash
npm install
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:5173
npm test
```
