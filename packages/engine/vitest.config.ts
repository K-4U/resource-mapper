import { defineConfig } from 'vitest/config'
import { sharedReporters, sharedCoverage } from '../../vitest.shared.js'

export default defineConfig({
  test: {
    name: 'engine',
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
