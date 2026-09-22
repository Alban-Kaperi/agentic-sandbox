---
name: grill-me
description: "Interview the user about a ticket or idea, one question at a time, until no ambiguity is left, then write the agreed decisions as a spec section into the plan. Use when a ticket is vague, touches several modules, or the user asks to be grilled or interviewed before planning."
argument-hint: "#<issue-number> or a one-line idea"
---

# Grill me

Goal: remove ambiguity before any code exists. You interview, the user decides.

## Rules
- One question per message. Wait for the answer.
- Before asking, check the code. If the repository already answers the question, do not ask it; state what you found with the file path.
- Ask about behaviour, edge cases, error responses, data shape, the environment contract (`src/config.ts` and `k8s/configmap.yaml`), tests, and what is explicitly out of scope.
- Offer a default with every question ("I would assume X, ok?") so the user can answer with one word.
- Stop when three questions in a row would only confirm what is already decided.

## Output
Write the decisions to `plans/<issue>.md` under `## Decisions`, one short statement each, with its source (the user's answer or a file path). Then continue with the `plan-ticket` skill. Do not implement anything inside this skill.
