# Reference — techniques and lessons (from the course slides and the FR-02 run)

Sources: [AR] Automation & Regression Testing AI-First, [S12] Automation testing, [TC] Test Cases AI-First (course slides). Details: `docs/techniques-from-slides.md`.

## Technique checklist
- **What to automate** [S12 tr.12–13, AR tr.4]: repeated, data-heavy, high-risk, multi-platform; not changing/ad-hoc/human-judgement tests (record those as "not automated + reason").
- **3A** [AR tr.12]: Arrange (locators + known state) → Act (one behaviour) → Assert (one clear check).
- **Patterns** [AR tr.13–14]: data-driven + Page Object Model + DRY. Test reads as intent.
- **Locators/assertions** [AR tr.29–30]: role/label/test-id first; web-first `expect()`; no sleeps.
- **Flaky** [AR tr.15,34]: timing, ordering, environment → auto-wait, independent tests, reset state.
- **Test quality** [TC tr.12]: accurate, economical, repeatable, traceable (`spec_ref`), self-standing, self-cleaning.
- **Prompting** [TC tr.21]: ROLE / CONTEXT (real spec) / TASK / FORMAT / CONSTRAINTS, then iterate "what did you miss?".
- **AI failure modes** [TC tr.22]: hallucinated expected results, plausible redundancy, missing domain edges, invented UI/fields. House rule: no AI test enters the suite before a human checks its expected result against the spec.

## Lessons from FR-02 (apply to the next feature)
| Situation | What went wrong / what worked |
|---|---|
| Locators | The login form had unbound `<label>`s and no test-ids → `getByLabel` unusable; positional locators inside the POM, noted in P1 |
| Hidden state | Admin API exposed `login_attempts`/`locked_until`: the oracle that made boundary tests meaningful |
| Vacuous test | UI showed one constant error string → "locked text == wrong text" always passed; compare API messages too |
| Boundary tests | With a counter bug, "3 wrong attempts then locked" passed for the wrong reason; assert the lock state after each count |
| Waiting for a time-based rule | Poll elapsed time, then act once; do not retry while the SUT is in the state under test |
| Missing edge | Spec word "consecutive" (wrong, wrong, correct, wrong, wrong) was missed until iteration |
| Isolation | Unique account per test and per browser, created and deleted through the API |
| Reports | Title is rendered by JS: verify "Run by" by opening the report, not by grepping the HTML |
| Official run | Pass spec paths to `npm run test:all --` so TODO skeletons do not create fake passes |
| Git/GitHub | Explicit `git add` paths; push and public issues only on request; shell arrays are 1-indexed in zsh |
| Bug evidence | Re-collect real data from the SUT with a script; UI shots may carry an annotation overlay, say so |

## Failure classification
SUT bug (violates spec, reproducible by a probe outside the test) · script error (wrong locator/assertion/data) · flaky (timing/order/env) · spec gap (spec silent → no pass/fail verdict) · environment (server down, DB reseeded).
