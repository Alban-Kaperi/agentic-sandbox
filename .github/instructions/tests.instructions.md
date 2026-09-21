---
applyTo: "{test,e2e}/**/*.ts"
---
# Tests

- Unit tests: vitest with supertest against `createApp`, one `describe` per feature, plain assertions, no snapshots, no mocks of our own modules.
- Browser tests: Playwright, locate elements by role, label, or placeholder, never by CSS class. They run headless against a real server and need no vision model.
- A test that fails after your change is information, not an obstacle. Fix the code or explain in the PR why the test was wrong. Never weaken assertions or skip tests to get green.
