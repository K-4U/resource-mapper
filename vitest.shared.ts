import type { ReporterName } from 'vitest/reporters';
import type { CoverageReporter } from 'vitest/node';

/**
 * Shared vitest configuration — reporters, coverage settings.
 * Imported by both vitest.workspace.ts (for direct vitest runs)
 * and individual package vitest.config.ts files (for NX executor runs).
 */

export const sharedReporters: ReporterName[] = ['verbose', 'junit', 'json'];

export const sharedCoverage = {
  provider: 'v8' as const,
  // text         → terminal summary table
  // json-summary → read by davelosert/vitest-coverage-report-action for the PR comment
  // json         → read by davelosert for per-file detail (coverage-final.json)
  // lcov         → optional, useful for Codecov / SonarCloud
  reporter: ['text', 'json-summary', 'json', 'lcov'] as CoverageReporter[],
  reportOnFailure: true,
};
