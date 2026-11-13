# HW04 – Automation Testing (HW04-AI)

- **Student ID:** `23120264`  | **Name:** Nguyễn Phúc Hoàng
- **SUT:** EShop – https://github.com/ttbhanh/eshop-sut (local copy: `../eshop-sut-fithcmus`)
- **Tools:** Playwright (TypeScript), Playwright HTML reporter, AI: `TODO`
- **GitHub repo (public):** `TODO`
- **Demo video (unlisted YouTube):** `TODO`
- **Skill demo video:** `TODO`

## Features (same as HW02, one per pool)
| Feature | Pool | FR | Name |
|---|---|---|---|
| A | A | FR-02 | Login & account lockout |
| B | B | FR-08 | Checkout |
| C | C | FR-16 | Import products from CSV (Web Admin) |

## Test summary
| Metric | Value |
|---|---|
| Features | 3 |
| Test cases automated | `TODO` (≥ 36) |
| Executed | `TODO` |
| Passed | `TODO` |
| Failed | `TODO` |
| Browser runs | `TODO` (≥ 9) |
| Bugs found | `TODO` |

## Progress
| Feature | Automated | Executed | Passed | Failed | Browser runs | Bugs (distinct) |
|---|---|---|---|---|---|---|
| A FR-02 | 20 | 60 (20 × 3) | 33 | 27 | 3 | 6 (`docs/bug-report.md`) |
| B FR-08 | 0 | – | – | – | 0 | – |
| C FR-16 | 0 | – | – | – | 0 | – |

Details: `docs/fr02-multibrowser-results.md`.

## Self-assessment
| No. | Criteria | Grade | Self-Assessed Grade |
|---|---|---|---|
| 1 | Task 1 – Feature A | 25 | |
| 1 | Task 1 – Feature B | 25 | |
| 1 | Task 1 – Feature C | 25 | |
| 2 | Task 2 – Demo video | 15 | |
| 3 | Agent Skills | 10 | |
| | **Total** | **100** | |

## Run
```bash
git clone https://github.com/ttbhanh/eshop-sut (local copy: `../eshop-sut-fithcmus`)   # run SUT per its README
cp .env.example .env                              # set STUDENT_ID, BASE_URL
npm install && npm run install:browsers
npm run test:all                                  # 3 browsers -> reports/<browser>/index.html
npm run commit-log                                # docs/git-commit-log.txt
```

## Layout
```
tests/      fr02-login-lockout / fr08-checkout / fr16-import-csv .spec.ts (data-driven)
data/       one CSV per feature
utils/      data loader
reports/    HTML reports per browser (chromium, firefox, webkit)
docs/       report.md, ai-audit-report.md, ai-critique.md, bug-report.md, git-commit-log.txt, evidence/
skill/      Agent Skill (SKILL.md)
scripts/    run-all.sh, gen-commit-log.sh
```
