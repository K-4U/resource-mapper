/// <reference types="vitest/config" />
import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';
import {sharedReporters, sharedCoverage} from '../../vitest.shared.js';

export default defineConfig({
    test: {
        expect: {
            requireAssertions: true
        },
        reporters: sharedReporters,
        outputFile: {
            junit: './coverage/junit.xml',
            json:  './coverage/test-results.json',
        },
        coverage: {
            ...sharedCoverage,
            reportsDirectory: './coverage',
        },
        projects: [{
            extends: './vite.config.ts',
            test: {
                name: 'client',
                browser: {
                    enabled: true,
                    provider: playwright(),
                    instances: [{
                        browser: 'chromium',
                        headless: true
                    }]
                },
                include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
                exclude: ['src/lib/server/**']
            }
        }, {
            extends: './vite.config.ts',
            test: {
                name: 'server',
                environment: 'node',
                include: ['src/**/*.{test,spec}.{js,ts}', 'scripts/**/*.{test,spec}.{js,ts}'],
                exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
            }
        }]
    }
});
