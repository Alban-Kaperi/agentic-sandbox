---
applyTo: "src/**/*.ts"
---
# API and application code

- TypeScript strict mode, ES modules, imports of local files end in `.js`.
- Routes live in `src/app.ts`, domain logic and validation in `src/runs.ts`, configuration in `src/config.ts`. Do not read `process.env` anywhere except `src/config.ts`.
- Validation throws `ValidationError` with a `details` array; the error handler maps it to HTTP 400. Not-found responses are `{ error: "... not found", id }` with HTTP 404.
- New endpoints get a unit test in `test/app.test.ts` using supertest before the route is considered done.
- Keep handlers synchronous unless there is I/O. There is no database in this sandbox.
- Log with one JSON object per line. Never log request bodies.
