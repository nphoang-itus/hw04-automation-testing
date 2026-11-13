# HW04 – Main Report

## 1. Feature selection
A: FR-02 Login & lockout (Pool A) · B: FR-08 Checkout (Pool B) · C: FR-16 CSV import (Pool C). HW02 also covered FR-20 (Mobile checkout, no coupon, Pool D) — not used here since this homework automates the web only.
Features, pools, and HW02 reference (or reason HW02 is unavailable). Not duplicated within group.

## 2. Approach (AI-first, step by step)
Per feature: steps taken with the AI (analysis → locators → data file → script → assertions → multi-browser), not one generic prompt.

## 3. Automation results
| Feature | Test cases | Pass | Fail | Chromium | Firefox | WebKit |
|---|---|---|---|---|---|---|
| A FR-02 | | | | | | |
| B FR-08 | | | | | | |
| C FR-16 | | | | | | |

Test data files: `data/fr02-login-lockout.csv, fr08-checkout.csv, fr16-import-csv.csv`. Assertion patterns used: (≥ 3, list).

## 4. Review / gap analysis of AI-generated scripts
| # | Feature | What AI got wrong/missed | Why (prompt / model limit / feature trait) | My fix |
|---|---|---|---|---|

## 5. Test cases not automated
| ID | Reason |
|---|---|

## 6. Bugs found
See `bug-report.md` and GitHub Issues links.

## 7. Agent Skill
Summary of `skill/SKILL.md` + demo link.
