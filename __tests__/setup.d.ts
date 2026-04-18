/**
 * @fileoverview Type declarations for Vitest test environment
 *
 * This file extends Vitest's type definitions to include global test
 * functions (describe, it, expect, vi, etc.) without requiring explicit
 * imports in every test file.
 *
 * Required by the `globals: true` setting in vitest.config.ts.
 *
 * @module @stackra/ts-redis
 * @category Configuration
 */

// Extend the global scope with Vitest's test functions.
// This enables TypeScript to recognize describe, it, expect, vi, etc.
// as global variables without import statements.
import 'vitest/globals';
