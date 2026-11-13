---
name: data-driven-playwright
description: Generate and maintain data-driven, multi-browser Playwright tests (CSV/JSON data, HTML report with "Run by: StudentID") for a web feature. Use when asked to automate test cases for a feature.
---

# Workflow
1. Read the feature spec/test cases; list cases (positive/negative/edge, ≥ 12).
2. Put data in `data/<feature>.csv|json` (never inline).
3. Inspect the live page; pick stable locators (role/label/test-id).
4. Generate `tests/<feature>.spec.ts` using `loadData()`.
5. Use ≥ 3 assertion patterns (URL, text, visibility, count...).
6. Run `npm run test:all` (chromium/firefox/webkit); review failures; file bug reports with screenshots.
7. Append each AI interaction to `docs/ai-audit-report.md`.

# Rules
- Review AI output; fix fragile selectors and weak assertions.
- Report must show `Run by: $STUDENT_ID`.
