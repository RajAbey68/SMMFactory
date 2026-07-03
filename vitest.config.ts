import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        // Only real vitest suites. tests/truth-tests.ts is a manual structural
        // script (run via `npm run test:truth`) and must NOT be picked up here —
        // it doesn't match *.test.ts, and nothing else outside tests/ should run.
        include: ['tests/**/*.test.ts', 'tests/**/*.test.mjs'],
    },
});
