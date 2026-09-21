Add GET /api/vehicles listing distinct vehicle IDs
feature, module:vehicles
## Goal
Clients want a list of vehicles that have at least one run, without paging through all runs.

## Done when
- `GET /api/vehicles` returns `["WVW-1001","WVW-2042",...]` sorted ascending, no duplicates
- Unit test covers the seeded data and the empty store
- README lists the endpoint
