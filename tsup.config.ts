/**
 * @fileoverview tsup build configuration for @stackra/ts-redis
 *
 * Uses the @nesvel/tsup-config base preset which automatically handles:
 * - Dual format output (ESM + CJS)
 * - TypeScript declaration generation
 * - Auto-externalization from package.json (deps, peerDeps, devDeps)
 * - License banner injection
 * - Tree shaking and clean builds
 *
 * Build output:
 *   dist/index.mjs   — ESM (tree-shakeable, modern bundlers)
 *   dist/index.js    — CJS (Node.js, legacy bundlers)
 *   dist/index.d.ts  — TypeScript declarations
 *
 * @module @stackra/ts-redis
 * @category Configuration
 * @see https://tsup.egoist.dev/
 */

import { basePreset as preset } from '@nesvel/tsup-config';

export default preset;
