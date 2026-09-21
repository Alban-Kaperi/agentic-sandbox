Add GET /api/runs/summary with average CO2 per vehicle
feature, module:summary
## Goal
Managers want one number per vehicle instead of scrolling through runs.

## Done when
- `GET /api/runs/summary` returns `[{ "vehicleId", "runs", "avgCo2GramsPerKm" }]` sorted by vehicleId, average rounded to one decimal
- Route is registered before `GET /api/runs/:id` so that `summary` is not treated as an id
- Unit test on the seeded data
- README lists the endpoint
