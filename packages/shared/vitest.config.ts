import { defineConfig } from 'vitest/config'
import { sharedReporters, sharedCoverage } from '../../vitest.shared.js'

/**
 * Per-package config used by the @nx/vitest:test executor.
 * Reporters and coverage settings are imported from vitest.shared.ts.
 */
export default defineConfig({
  test: {
    name: 'shared',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['dist/**/*'],
    reporters: sharedReporters,
    outputFile: {
      junit: './coverage/junit.xml',
      json:  './coverage/test-results.json',
    },
    coverage: {
      ...sharedCoverage,
      reportsDirectory: './coverage',
    },
  },
})

