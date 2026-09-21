Filter runs by vehicle on the web page
feature, module:ui
## Goal
The table on `/` shows all runs. Users want to type a vehicle ID and see only its runs.

## Done when
- A text input labelled "Filter by vehicle" above the table filters the rows as the user types (client side is fine)
- Clearing the input shows all rows again
- A Playwright test in `e2e/` types `WVW-1001` and asserts that only its runs are visible
- Existing browser test still passes
