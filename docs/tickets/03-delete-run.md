Add DELETE /api/runs/:id
feature, module:delete
## Goal
Test engineers need to remove runs that were recorded against the wrong vehicle.

## Done when
- `DELETE /api/runs/:id` answers 204 and the run is gone from `GET /api/runs`
- Unknown id answers 404 with the documented error shape
- Runs in status `running` cannot be deleted: answer 409 with `error: "run is in progress"`
- Unit tests for all three cases
