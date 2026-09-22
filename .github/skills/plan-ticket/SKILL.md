---
name: plan-ticket
description: "Turn a ticket into a short, evidence-based implementation plan with dependency analysis before any code is written. Use when starting work on an issue or when asked to plan."
---

# Plan a ticket

Produce `plans/<issue-number>.md` and nothing else. Do not edit source files while planning.

## Steps

1. Restate the ticket in two sentences: what changes for the user, what does not.
2. Find every place the change touches. Use search across `src/`, `test/`, `e2e/`, `k8s/`, `public/`, and `README.md`. For each hit, record the file path and why it is affected.
3. Classify each dependency:
   - **confirmed**: you read the code and it is affected (cite path and symbol)
   - **plausible**: inferred from naming or structure, not read (cite the path and say how to verify)
   - **open**: could not determine, needs a human answer
4. Check the environment contract: does the change add or require a variable in `src/config.ts`? Then `k8s/configmap.yaml` and the README table are in scope.
5. List the tests you will add or change, by file.
6. List risks and what could break, including the pipeline steps that could fail (unit, rollout, stability, smoke, browser).
7. Write open questions as a numbered list. If any question blocks the implementation, stop after the plan and ask.

## Output format

```
# Plan for #<n>: <title>

## Goal
## Dependencies (confirmed / plausible / open), each with change: yes | no
## Tests
## Environment contract
## Risks
## Open questions
```

Keep it under 60 lines. The plan is reviewed before implementation starts.
