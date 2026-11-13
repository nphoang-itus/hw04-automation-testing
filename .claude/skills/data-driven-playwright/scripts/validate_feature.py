#!/usr/bin/env python3
"""Check a feature against the HW04 rules. Exit 1 if any ERROR.

python3 validate_feature.py fr02 [--root .]      (slug prefix: matches tests/<prefix>*.spec.ts and data/<prefix>*)
"""
import argparse, csv, glob, json, os, re, sys

PATTERNS = {
    "URL": r"toHaveURL",
    "text": r"toContainText|toHaveText",
    "visibility": r"toBeVisible|toBeHidden",
    "attribute": r"toHaveAttribute|toHaveValue",
    "count": r"toHaveCount",
    "value/status": r"\.toBe\(|\.toEqual\(|toBeLessThan|toBeGreaterThan|status\(\)",
    "property": r"toHaveProperty",
    "null/truthy": r"toBeNull|toBeTruthy|toBeFalsy",
    "polling": r"expect\.poll|toPass",
    "validity": r"validity",
}
errors, warns = [], []


def err(m): errors.append(m)
def warn(m): warns.append(m)


def main():
    p = argparse.ArgumentParser(); p.add_argument("prefix"); p.add_argument("--root", default=".")
    a = p.parse_args(); r = a.root
    specs = sorted(glob.glob(f"{r}/tests/{a.prefix}*.spec.ts"))
    datas = sorted(glob.glob(f"{r}/data/{a.prefix}*.csv") + glob.glob(f"{r}/data/{a.prefix}*.json"))
    if not specs: err(f"no spec matches tests/{a.prefix}*.spec.ts")
    if not datas: err(f"no data file matches data/{a.prefix}*")

    ids, total = [], 0
    for f in datas:
        rows = json.load(open(f, encoding="utf-8")) if f.endswith(".json") else list(csv.DictReader(open(f, encoding="utf-8")))
        total += len(rows)
        for row in rows:
            ids.append(row.get("id", ""))
            if any("TODO" in str(v) for v in row.values()): err(f"{os.path.basename(f)}: TODO left in {row.get('id')}")
            if not row.get("spec_ref"): warn(f"{os.path.basename(f)}: {row.get('id')} has no spec_ref (traceability)")
    if total < 12: err(f"only {total} test cases in data files (need >= 12)")
    dup = {i for i in ids if ids.count(i) > 1}
    if dup: err(f"duplicate ids: {sorted(dup)}")
    if len({i.split('-')[0] for i in ids if i}) > 1: warn("ids use more than one prefix")

    used = set(); code = ""
    for f in specs:
        t = open(f, encoding="utf-8").read(); code += t; n = os.path.basename(f)
        if "loadData" not in t: err(f"{n}: does not load data through loadData()")
        if re.search(r"\[\s*\{\s*id\s*:", t): err(f"{n}: inline array of cases (move to data/*.csv|json)")
        if re.search(r"waitForTimeout|(?<!test\.)\bsetTimeout\(|\bsleep\(", t): err(f"{n}: fixed sleep (use response/state/expect.poll)")
        if re.search(r"createTestAccount|create\w+\(request", t) and "finally" not in t: warn(f"{n}: creates data but has no finally cleanup")
        if "TODO" in t: err(f"{n}: TODO left in spec")
    for name, rx in PATTERNS.items():
        if re.search(rx, code): used.add(name)
    if len(used) < 3: err(f"only {len(used)} assertion patterns ({sorted(used)}); need >= 3")

    cfg = f"{r}/playwright.config.ts"
    if os.path.exists(cfg):
        c = open(cfg, encoding="utf-8").read()
        for b in ("chromium", "firefox", "webkit"):
            if b not in c: err(f"playwright.config.ts: project {b} missing")
        if "Run by" not in c: err("playwright.config.ts: report title lacks 'Run by: <StudentID>'")
    for b in ("chromium", "firefox", "webkit"):
        if not os.path.exists(f"{r}/reports/{b}/index.html"): warn(f"reports/{b}/index.html missing (run npm run test:all -- <specs>)")

    print(f"cases: {total} | specs: {len(specs)} | assertion patterns ({len(used)}): {sorted(used)}")
    for m in warns: print("WARN ", m)
    for m in errors: print("ERROR", m)
    print("RESULT:", "FAIL" if errors else "OK")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
