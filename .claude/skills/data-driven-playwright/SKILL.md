---
name: data-driven-playwright
description: Generate and maintain data-driven, multi-browser Playwright test suites for one web feature (CSV/JSON data, page objects, per-test isolated accounts, HTML report with "Run by: <StudentID>", bug report with evidence). Use when asked to automate test cases of a feature (e.g. "automate FR-08", "add test cases to the login suite", "re-run on 3 browsers", "review the AI-generated spec").
---

# Data-driven, multi-browser Playwright workflow (AI-first, human-reviewed)

One feature = one slug (e.g. `fr08-checkout`). Work **step by step and stop for the student's review after each step**; never ask the AI for "all the scripts" in one prompt. Technique background: `reference.md`. Files to copy from: `templates/`. Helper scripts: `scripts/`.

## Inputs to confirm first
Feature (FR id + pool), SUT URLs and credentials (`.env`), student ID (`STUDENT_ID`), the real spec text of the feature (paste it, never let the AI guess). If the spec is silent on something, record a **spec gap** — do not invent expected results.

## Steps
0. **Scaffold:** `python3 .claude/skills/data-driven-playwright/scripts/new_feature.py <slug> --fr FR-xx --title "<name>" --prefix FRxx`. Creates `tests/<slug>.spec.ts`, `pages/<Name>Page.ts`, `data/<slug>.csv`, `docs/<slug>/` templates (never overwrites without `--force`).
1. **P1 Analyse (exploratory):** read spec + frontend code + API. Fill `docs/<slug>/p1-analysis.md`: usable locators (and which are *not* usable), hidden state and how to observe it (oracle), flaky risks, code-reading hypotheses `H1..` (hypotheses, not bugs).
2. **P2 Test cases:** table ROLE/CONTEXT/TASK/FORMAT/CONSTRAINTS (`docs/<slug>/p2-testcases.md`). ≥ 12 cases; positive/negative/edge/BVA; Action+Function+Condition titles; each expected result tagged **S** (spec), **D** (derived), **A** (assumption). Student approves/removes cases and rules on ambiguous ones.
3. **P3 Data files:** `data/<slug>.csv` (flow cases) and optionally `data/<slug>-checks.json` (structure/state/security checks). Every varying parameter and expected value lives in the data file, none in the spec. Columns carry `spec_ref`.
4. **P4 Helpers:** page object (`pages/`) with locators + actions; API helper (`utils/api.ts`) to create/delete isolated test data and read hidden state. Smoke-test helpers on the live SUT before writing specs; keep the smoke test out of git.
5. **P5 Draft spec:** AI writes the spec; **commit it unreviewed** (`test(<FR>): AI-generated draft spec (unreviewed)`) so the review diff is evidence.
6. **P7 First real run (Chromium):** `npx playwright test tests/<slug>*.spec.ts --project=chromium`. Classify every failure: **SUT bug / script error / flaky / spec gap**, with evidence (probe the API, read the DB state). Also distrust passes (vacuous assertions).
7. **P6 Iterate:** ask the AI "what inputs/boundaries/oracles did you miss?"; fix weaknesses one fix per commit; re-run. Record AI gaps in `docs/<slug>/p6-iteration.md` (what, type, why the AI missed it, commit).
8. **Multi-browser:** `npm run test:all -- tests/<slug>*.spec.ts` (chromium → firefox → webkit, one HTML report each in `reports/<browser>/`). Open each report in a browser and confirm the title shows `Run by: <StudentID> | <ISO time>`.
9. **Bugs:** group failing tests by root cause → `docs/bug-report.md` (steps, expected quoted from spec, actual, severity proposal, test mapping, evidence image). Capture evidence from the live SUT with a script (adapt `templates/capture-bug-evidence.mjs` (FR-02 example)). **Ask the student before creating public GitHub Issues**; images must be pushed first.
10. **Validate:** `python3 .claude/skills/data-driven-playwright/scripts/validate_feature.py <slug>` — must report no ERROR before declaring the feature done.

## Hard rules
- Data-driven: no inline arrays of cases in specs; separate `.csv`/`.json`.
- ≥ 12 cases, ≥ 3 distinct assertion patterns, 3 browsers, HTML report with `Run by: <StudentID>`.
- Each test creates its own data (unique per test and browser) and cleans up in `finally`. No test depends on another.
- No fixed sleeps (`waitForTimeout`); wait on a response, on state, or on elapsed time with `expect.poll`.
- Expected results come from the **spec**, never from current SUT behaviour. Never fabricate a result: numbers come from real runs.
- Assert **hidden state** (DB/API) as well as what the UI shows; a UI that shows one constant message cannot prove anything about the cause.
- Do not edit SUT code. Do not run unfinished skeleton specs in the official run.
- Commit small, `git add` explicit paths (never `git add tests` blindly — it swept a temp file once). Do not push unless the student asks.
- Log every AI interaction (project `CLAUDE.md` audit rule: `python3 scripts/ailog.py` + a row in `docs/ai-audit-report.md`).

## Done when
`validate_feature.py` is clean; 3 reports exist; failures classified; bug report written; AI-gap table filled; README progress row updated.
