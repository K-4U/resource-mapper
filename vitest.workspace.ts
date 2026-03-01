/**
 * Root vitest workspace — vitest 4.x.
 * Used when running vitest directly (npx vitest, test:watch, test:ui scripts).
 * NX executor runs use the per-package vitest.config.ts directly.
 *
 * Both import from vitest.shared.ts so reporters and coverage settings
 * are defined in one place.
 */
import { defineConfig } from 'vitest/config';
import { sharedReporters, sharedCoverage } from './vitest.shared.js';

export default [
  // ── Engine (pure Node.js) ─────────────────────────────────────────────────
  defineConfig({
    test: {
      name: 'engine',
      environment: 'node',
      include: ['packages/engine/src/**/*.test.ts'],
      exclude: ['packages/engine/dist/**'],
      reporters: sharedReporters,
      outputFile: {
        junit: 'packages/engine/coverage/junit.xml',
        json:  'packages/engine/coverage/test-results.json',
      },
      coverage: {
        ...sharedCoverage,
        reportsDirectory: 'packages/engine/coverage',
        include: ['packages/engine/src/**'],
        exclude: ['packages/engine/src/**/*.test.ts', 'packages/engine/dist/**'],
      },
    },
  }),

  // ── Shared (pure Node.js — types, validators, no UI) ─────────────────────
  defineConfig({
    test: {
      name: 'shared',
      environment: 'node',
      include: ['packages/shared/src/**/*.test.ts'],
      exclude: ['packages/shared/dist/**'],
      reporters: sharedReporters,
      outputFile: {
        junit: 'packages/shared/coverage/junit.xml',
        json:  'packages/shared/coverage/test-results.json',
      },
      coverage: {
        ...sharedCoverage,
        reportsDirectory: 'packages/shared/coverage',
        include: ['packages/shared/src/**'],
        exclude: ['packages/shared/src/**/*.test.ts'],
      },
    },
  }),

  // ── Core / server (Node.js tests only — browser tests need playwright) ────
  defineConfig({
    test: {
      name: 'core-server',
      environment: 'node',
      include: [
        'packages/core/src/**/*.{test,spec}.{js,ts}',
        'packages/core/scripts/**/*.{test,spec}.{js,ts}',
      ],
      exclude: ['packages/core/src/**/*.svelte.{test,spec}.{js,ts}'],
      reporters: sharedReporters,
      outputFile: {
        junit: 'packages/core/coverage/junit.xml',
        json:  'packages/core/coverage/test-results.json',
      },
      coverage: {
        ...sharedCoverage,
        reportsDirectory: 'packages/core/coverage',
        include: ['packages/core/src/**'],
        exclude: [
          'packages/core/src/**/*.test.ts',
          'packages/core/src/**/*.spec.ts',
          'packages/core/src/**/*.svelte.{test,spec}.{js,ts}',
        ],
      },
    },
  }),

  // ── Core / client (Svelte component tests via @vitest/browser + Playwright) ─
  //
  // YOUR QUESTION: Is Playwright the right framework for Svelte component tests?
  //
  // Short answer: YES — and you already have everything installed.
  // Your core package already has vitest-browser-svelte, @vitest/browser-playwright,
  // and playwright. That IS the right stack:
  //
  //   @vitest/browser  — runs tests inside a real browser (not jsdom/happy-dom)
  //   playwright       — the browser provider (drives Chromium/Firefox/WebKit)
  //   vitest-browser-svelte — mounts Svelte components in the browser for testing
  //
  // This is better than jsdom for Svelte because:
  //   - Real browser APIs (no jsdom quirks)
  //   - CSS, animations, and layout actually work
  //   - No separate Playwright test runner to learn — it's still just vitest
  //
  // HOW TO ADD IT HERE:
  // Uncomment the block below and install playwright browsers once:
  //   npx playwright install chromium
  //
  // Then write tests like:
  //   import { render } from 'vitest-browser-svelte'
  //   import MyComponent from './MyComponent.svelte'
  //   const screen = render(MyComponent, { props: { title: 'hello' } })
  //   await expect.element(screen.getByText('hello')).toBeVisible()
  //
  // ── Uncomment when you're ready to add Svelte component tests ──────────────
  // {
  //   extends: 'packages/core/vite.config.ts',   // inherits SvelteKit plugins
  //   test: {
  //     name: 'core-client',
  //     browser: {
  //       enabled: true,
  //       provider: 'playwright',
  //       instances: [{ browser: 'chromium', headless: true }],
  //     },
  //     include: ['packages/core/src/**/*.svelte.{test,spec}.{js,ts}'],
  //     reporters: sharedReporters,
  //     outputFile: {
  //       junit: 'packages/core/coverage/junit-client.xml',
  //       json:  'packages/core/coverage/test-results-client.json',
  //     },
  //     // Note: coverage in real browser mode uses @vitest/coverage-istanbul,
  //     // not v8 (v8 only works in Node). Add to core/package.json when ready:
  //     //   npm install -D @vitest/coverage-istanbul --workspace=packages/core
  //   },
  // },
];
