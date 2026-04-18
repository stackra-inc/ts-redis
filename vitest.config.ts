/**
 * @fileoverview Vitest configuration for @stackra/ts-redis package
 *
 * This configuration sets up the testing environment for the package,
 * including test globals, jsdom environment, coverage reporting, and path aliases.
 *
 * Configuration Features:
 * - Globals: Enables global test functions (describe, it, expect)
 * - Environment: Uses jsdom for React component testing
 * - Setup Files: Runs vitest.setup.ts before tests for DI mocking
 * - Coverage: Configures v8 coverage provider with HTML/JSON/text reports
 * - Path Aliases: Resolves @ to ./src for consistent imports
 * - Pass With No Tests: CI won't fail if no tests exist yet
 *
 * @module @stackra/ts-redis
 * @category Configuration
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Enable global test functions (describe, it, expect, vi, etc.)
    // without requiring explicit imports in every test file.
    globals: true,

    // Use jsdom to simulate a browser DOM environment.
    // Required for testing React hooks and components.
    // Pure logic tests work fine with jsdom too.
    environment: 'jsdom',

    // Runs before every test file. Used for:
    //   - Mocking DI decorators (@Injectable, @Inject, etc.)
    //   - Setting up global test utilities
    setupFiles: ['./__tests__/vitest.setup.ts'],

    // Only include files in the __tests__/ directory.
    // Supports .test.ts, .spec.ts, .test.tsx, .spec.tsx extensions.
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],

    // Don't fail the test run if no test files are found.
    // Useful during initial development before tests are written.
    passWithNoTests: true,

    // v8 coverage provider — faster than istanbul, uses V8's built-in
    // code coverage. Generates text (terminal), JSON, and HTML reports.
    coverage: {
      // Use v8 coverage provider (faster than istanbul)
      provider: 'v8',

      // Generate multiple report formats
      reporter: ['text', 'json', 'html'],

      // Exclude files from coverage
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.test.tsx', '**/*.config.ts'],
    },
  },

  // Resolve path aliases
  resolve: {
    alias: {
      // Map @ to ./src so imports like '@/services/cache.service' resolve
      // correctly in both source code and test files.
      '@': path.resolve(__dirname, './src'),
    },
  },
});
