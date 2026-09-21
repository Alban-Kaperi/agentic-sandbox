Reject CO2 values outside 0 to 500 g/km
bug, module:validation
## Goal
A run with `co2GramsPerKm: -5` or `9999` is currently accepted. Both are physically impossible for our cycles.

## Done when
- `POST /api/runs` answers 400 with a `details` entry `co2GramsPerKm must be between 0 and 500` for values outside the range
- Boundary values 0 and 500 are accepted
- Unit tests for below, above, and both boundaries
