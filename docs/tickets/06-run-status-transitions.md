Add PATCH /api/runs/:id/status with allowed transitions
feature, module:status
## Goal
A run moves through `planned`, `running`, `done`. Today the status is always `planned`.

## Done when
- `PATCH /api/runs/:id/status` with body `{ "status": "running" }` updates the run
- Only `planned -> running` and `running -> done` are allowed; anything else answers 409 with `error: "invalid transition"` and `from`, `to` fields
- Unknown id answers 404
- Unit tests for the happy path, an invalid transition, and an unknown id
