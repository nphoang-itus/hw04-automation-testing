# FR-08 / P6 — AI gaps found and fixed

Draft commit: `6efb6b9`. Run before: 9/15 pass (`docs/evidence/fr08-draft-chromium-run1.txt`). Run after: 9/17 pass (`docs/evidence/fr08-fixed-chromium-run2.txt`), Chromium only.

| # | Problem in the AI draft | Type | Why the AI missed it | Fix (commit) |
|---|---|---|---|---|
| 1 | No test calls `/api/checkout` directly, so "backend recomputes the total" depended on the UI input being editable | Missing coverage | Draft followed the UI flow of the P2 table only [TC tr.22 weak/vacuous tests] | New B06 `api_total_recomputed` (`43ff0e8`) |
| 2 | `setTotal()` return value ignored in A07–A10: if the input becomes read-only the tamper step is skipped and the test could pass vacuously | Vacuous test | Helper returns false instead of throwing; AI did not consider that path | Result recorded as an annotation (`96bb065`) |
| 3 | A06 (guest posts directly) only asserted status ≥ 400 | Weak assertion | Single oracle | Also asserts the user sees an error dialog (`750f4df`) |
| 4 | B03 only checked the untampered case | Missing variant | Happy path only | New B07 `totals_agree_after_tamper` (`52281c9`) |

## Result of run 2 (Chromium, 17 tests)

- 9 pass (A01–A06, B02, B03, B05), 8 fail.
- The 6 earlier failures are unchanged: A07–A10, B01, B04 (SUT bugs).
- New failures are both SUT bugs, not script errors:
  - B06: direct `POST /api/checkout` with `total_amount = 1` stores 1, expected 36,000,000 (same root cause as A07–A10, now confirmed without the UI).
  - B07: after typing 1 into the total input, the page's own summary shows 1, expected 30,000,000 (same root cause as B01, editable total).
- Script failures: 0.

## Still open

- Only Chromium; Firefox and WebKit not run yet.
- Empty/missing `total_amount` body is a spec gap (expected reliability: A), not covered.
- Orders cannot be deleted through the API, so stored orders remain until the backend restarts.
