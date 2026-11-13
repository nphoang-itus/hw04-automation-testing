#!/usr/bin/env python3
"""Scaffold one feature of the data-driven Playwright workflow (never overwrites unless --force).

python3 new_feature.py fr08-checkout --fr FR-08 --title "Checkout" --prefix FR08 [--root .] [--force]
"""
import argparse, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = os.path.join(HERE, "..", "templates")


def render(name, ctx):
    text = open(os.path.join(TPL, name), encoding="utf-8").read()
    for k, v in ctx.items():
        text = text.replace("{{" + k + "}}", v)
    return text


def write(path, text, force):
    if os.path.exists(path) and not force:
        print(f"skip   {path} (exists)")
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf-8").write(text)
    print(f"create {path}")


def main():
    a = argparse.ArgumentParser()
    a.add_argument("slug", help="e.g. fr08-checkout")
    a.add_argument("--fr", required=True, help="e.g. FR-08")
    a.add_argument("--title", required=True)
    a.add_argument("--prefix", required=True, help="test id prefix, e.g. FR08")
    a.add_argument("--root", default=".")
    a.add_argument("--force", action="store_true")
    a = a.parse_args()
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", a.slug):
        sys.exit("slug must be lower-case kebab-case")
    page_class = "".join(p.capitalize() for p in re.sub(r"^fr\d+-", "", a.slug).split("-")) + "Page"
    ctx = {"SLUG": a.slug, "FR": a.fr, "TITLE": a.title, "PREFIX": a.prefix, "PAGE_CLASS": page_class}
    r = a.root
    write(f"{r}/tests/{a.slug}.spec.ts", render("spec.ts.tpl", ctx), a.force)
    write(f"{r}/pages/{page_class}.ts", render("page.ts.tpl", ctx), a.force)
    write(f"{r}/data/{a.slug}.csv", render("cases.csv.tpl", ctx), a.force)
    write(f"{r}/data/{a.slug}-checks.json", render("checks.json.tpl", ctx), a.force)
    for tpl, out in (("p1-analysis.md.tpl", "p1-analysis.md"), ("p2-testcases.md.tpl", "p2-testcases.md"),
                     ("p6-iteration.md.tpl", "p6-iteration.md")):
        write(f"{r}/docs/{a.slug}/{out}", render(tpl, ctx), a.force)
    print("\nNext: P1 analysis -> P2 cases -> P3 data -> P4 helpers -> P5 draft (commit) -> run -> iterate. See SKILL.md.")


if __name__ == "__main__":
    main()
