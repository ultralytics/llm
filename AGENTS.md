# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, etc.) when working with code in this repository. CLAUDE.md is a symlink to this file.

## Core Principles (CRITICAL)

**Less is more. The simplest solution is the best solution.** The action hierarchy for every change: **Delete > Replace > Add**.

1. **Solve at the owner**: Put behavior in the code path that owns or observes it. For fixes, never guard a symptom with a staleness check, initialization flag, skip-first-call branch, or `try/except` around broken logic; relocate the trigger and delete the wrong path. For features, extend the existing owner rather than creating a parallel abstraction.
2. **Search and reuse first**: Search the whole repository before creating a feature, component, helper, workflow, or utility. Reuse or adapt what exists, consolidate in-scope duplication in the shared owner, and delete duplicate paths. Three similar lines beat a helper nobody else calls.
3. **Delete and modify existing code before creating new code**: Bugfixes are net-negative by default unless deletion and relocation are demonstrably impossible. A new file must first prove it cannot fit cleanly in an existing owner.
4. **Keep scope minimal**: Implement only the simplest complete solution. Avoid impossible-state handling, speculative flags, compatibility shims, policy scaffolding, and unrelated cleanup. Tests are out of scope by default — rely on existing coverage and focused validation; only an uncovered, high-risk regression path justifies minimal new test code.
5. **Ship zero-regression, production-ready changes**: Understand what you remove instead of retaining broken code as insurance. Remove unused imports, functions, types, files, and comments; run relevant cleanup checks; and thoroughly debug and validate the changed owner. Do not break existing features or workflows unless the PR intentionally removes them with evidence.

**Review gate:** for every addition, the reviewer decides whether deleting or changing existing code would have fixed the problem instead — if it would, that is a blocking finding. A missing or thin PR description is never itself a finding.

NEVER push to `main`. NEVER force push. Always start work in a new git worktree (`git worktree add`) on a feature branch and open a PR — never edit the primary checkout directly, it may hold in-flight work.

## PR Workflow

After opening a PR:

1. Wait for the automated PR review and auto-format commit from Ultralytics Actions (`format.yml`), then pull and address every finding.
2. Review the full diff in-session against the Core Principles, performance, and the review gate above, then batch the fixes into one commit and push. After each round of bot or human commits, pull and resume the same reviewer on `<last-reviewed-sha>..HEAD` plus anything that delta could have invalidated. Repeat until the local head matches the live head.
3. Hand off or merge only on a clean final pass: one cold full-diff review returning LGTM with no findings, on a head that is still live at merge time.
4. Never fight other commits: Ultralytics Actions pushes auto-format and header commits, and multiple users may work on the same PR. `git pull --rebase` before pushing; never reset or revert commits you did not author.
5. After the PR merges, clean up: remove local worktrees and branches for it, then `git checkout main && git pull`.

## Commands

```bash
# Install (editable, with dev extras)
uv pip install -e ".[dev]"

# Run all tests
python -m pytest tests -v

# Run one test
python -m pytest tests/test_client.py::test_client_init -v

# Coverage exactly as CI runs it (ci.yml)
python -m pytest tests -v --cov=./ --cov-report=xml:pytest-coverage.xml

# Format and lint Python (config source of truth: [tool.ruff] in pyproject.toml)
ruff format . && ruff check --fix .

# Rebuild the minified widget (same flags as minify.yml)
terser js/chat.js -o js/chat.min.js -c -m --comments false
```

CI (`ci.yml`) runs the coverage command above on ubuntu/macos/windows × Python 3.9 and 3.14; `requires-python >=3.9` is the floor. Pytest `addopts` in pyproject.toml adds `--doctest-modules`, so docstring examples in the tested paths must run.

## Architecture

This repo ships the Ultralytics chat widget: `js/chat.js`, a single zero-dependency vanilla JS file (~1700 lines) defining the `UltralyticsChat` class (floating pill → modal with SSE-streamed chat, search mode via the `/chat`→`/search` URL swap, in-memory session ID from the `X-Session-ID` response header; localStorage stores only the pill position). It is delivered via jsDelivr CDN as `js/chat.min.js`. The Python package `ultralytics_llm` is a placeholder: `LLMClient.chat()` raises `NotImplementedError`, and only `__version__` and the constructor are real.

- `js/chat.min.js` is generated: `minify.yml` re-minifies and commits it on PRs that touch `js/chat.js` — never hand-edit it.
- `purge-cdn.yml` purges the jsDelivr cache on pushes to main touching `js/**` and after the "Tag and Release" workflow completes.
- Releases are manual: `tag.yml` is `workflow_dispatch`-only and gated to repo `ultralytics/llm` with actor `glenn-jocher`; it creates a git tag and GitHub release. There is no PyPI publish workflow.
- The package version lives in `ultralytics_llm/__init__.py` (`__version__`) and is read dynamically by setuptools.
- `examples/web/demo.html` is a standalone local demo; open it directly in a browser without a server or build step.

## Conventions

- Ultralytics Actions (`format.yml`) pushes auto-format commits to PR branches: Ruff + docformatter for Python, Prettier for YAML/JSON/Markdown, codespell, and AGPL-3.0 license headers — don't add or revert headers manually.
- Ruff config: line length 120, `target-version = "py310"`, Google docstring convention, `docstring-code-format = true`; only the `UP` lint rules are selected.
- JS style comes from `biome.json` (2-space indent, width 120, double quotes, semicolons); `format.yml` has `biome: false`, so run Biome locally if you touch `js/chat.js`.
- Tests live in `tests/` and run offline — no test hits the live network.
- To release: bump `__version__` in `ultralytics_llm/__init__.py`, merge, then run the "Tag and Release" workflow manually with the new tag name.
