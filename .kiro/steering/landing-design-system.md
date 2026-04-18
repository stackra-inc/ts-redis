---
inclusion: fileMatch
fileMatchPattern: '**/landing/**,**/pages/landing/**'
---

# MNGO Landing Page Design System

## Core Principles

- Sharp, technical, enterprise aesthetic — inspired by neon.tech and terminal UI
- NO border-radius anywhere — all corners are sharp (remove all `rounded-*`
  classes)
- Monospace labels for section headers and technical specs
- Flat grid borders with `border-white/10` and `gap-px` patterns
- Left-aligned content by default, centered only for stats
- Sparse layout with generous negative space
- Black background `bg-black` (not `bg-[#0a0a0f]`)

## Typography

- Headlines: `font-medium` or `font-light` (NOT font-black/font-bold) — clean,
  not heavy
- Section labels:
  `text-[10px] font-mono tracking-widest uppercase text-white/30`
- Body: `text-sm text-white/40 leading-relaxed`
- Stats values: `text-[#FE854E] font-mono`

## Colors

- Background: `bg-black`
- Cards: `bg-black` with `border border-white/10`
- Accent: `#FE854E` — used sparingly on stats, active states, CTAs
- Text hierarchy: white (100%) → white/60 → white/40 → white/30 → white/20

## Components

- Cards: `border border-white/10 bg-black p-8` — NO rounded corners
- Buttons: Sharp corners, `border border-white/20` or `bg-[#FE854E] text-black`
- Grids: Use `gap-px border border-white/10 bg-white/10 p-px` for Neon-style
  grid
- Hover: `hover:bg-white/[0.02]` — subtle, not dramatic
