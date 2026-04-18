/**
 * @fileoverview ESLint configuration for @stackra/ts-redis package
 *
 * This configuration extends the shared @nesvel/eslint-config with
 * project-specific ignore patterns. Uses the ESLint flat config format.
 *
 * Configuration Features:
 * - TypeScript Rules: TypeScript-aware linting via typescript-eslint
 * - Import Ordering: Enforces consistent import order and detects unused imports
 * - Code Style: Consistent code style enforcement across the monorepo
 * - Ignore Patterns: Excludes build output, node_modules, and config files
 *
 * @module @stackra/ts-redis
 * @category Configuration
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 */

// Import the Linter type for type-safe configuration
import type { Linter } from 'eslint';

// Import the shared Vite-optimized ESLint configuration from @nesvel/eslint-config.
// This includes TypeScript, import ordering, and style rules.
import { viteConfig } from '@nesvel/eslint-config';

const config: Linter.Config[] = [
  // Spread the shared Nesvel ESLint configuration.
  // Includes TypeScript, import, and style rules.
  ...viteConfig,

  // Files and directories excluded from linting:
  //   - dist/          — build output (generated code)
  //   - node_modules/  — third-party dependencies
  //   - *.config.js    — JavaScript config files
  //   - *.config.ts    — TypeScript config files (tsup, vitest, etc.)
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts'],
  },

  // Add package-specific rule overrides here.
  // These take precedence over the shared config.
  {
    rules: {},
  },
];

export default config;
