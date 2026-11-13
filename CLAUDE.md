# CLAUDE.md — HW04 Automation Testing (HW04-AI)

Student: Nguyễn Phúc Hoàng · ID `23120264` · Class CQ2023/3 · Tool: Claude Code. Reply in **Vietnamese**, keep technical terms in English.
Spec: `docs/HW04-assignment.pdf`. SUT: `../eshop-sut-fithcmus` (backend :3000, web :5173, admin :5174).
Features (web only): FR-02 login/lockout (Pool A), FR-08 checkout (Pool B), FR-16 CSV import (Pool C, admin). FR-20 mobile is out of scope for HW04.
Repo: https://github.com/nphoang-itus/hw04-automation-testing (public; ≥ 8 commits touching `.spec.ts`).

## AI audit — MANDATORY on every prompt
After finishing each user prompt, before the final reply:
1. Run `python3 scripts/ailog.py` → rebuilds `docs/ai/prompt-log.md` (verbatim prompt + output, time, files).
2. Append **one row** to the audit table in `docs/ai-audit-report.md` §3 for that turn: prompt (short quote + `prompt-log.md #n`), output summary, verdict (VALID / INVALID / INCOMPLETE), reasoning (cite slide / ISTQB / spec section), student fix. Never invent a verdict about the student's review: if unknown, write what *Claude* verified and mark `Student review: pending`.
3. Refresh §4 statistics (counts + percentages).
4. Commit the audit files with the related work (do not push unless asked).

**Exception:** if the user says a prompt is a chore / trivial task (`việc vặt`), skip the audit for it. To keep the log consistent, ask the user to start such prompts with `[chore]` (the script skips them); if they only say so in words, remove nothing from the log but add no audit row and note "chore, not audited" in `docs/ai/chore-turns.md`.

## Agent Skill
Reusable workflow: `.claude/skills/data-driven-playwright/` (SKILL.md, reference.md, templates/, scripts/new_feature.py, scripts/validate_feature.py). Use it for FR-08, FR-16 and any new feature; run `validate_feature.py <prefix>` before calling a feature done.

## Rules
- AI-first, step by step per feature (analyse → locators → data file → script → assertions → multi-browser); never one generic prompt.
- Test data only in `data/*.csv|json`; ≥ 12 cases per feature; ≥ 3 distinct assertion patterns; 3 browsers; HTML report shows `Run by: 23120264`.
- Never fabricate execution results or bugs; Actual/Status come from real runs. Bugs → `docs/bug-report.md` + GitHub Issues with screenshot.
- Do not modify SUT code. The SUT backend reseeds the DB on every start.
- AI Critique (`docs/ai-critique.md`, 200–300 words) is written by the **student**.
- Commit small and often; test-script commits count toward the 8-commit minimum. `npm run commit-log` before submission.
