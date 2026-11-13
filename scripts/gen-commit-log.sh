#!/usr/bin/env bash
cd "$(dirname "$0")/.."
git log --date=iso --pretty=format:'%h | %ad | %an | %s' --stat > docs/git-commit-log.txt
echo "Wrote docs/git-commit-log.txt"
