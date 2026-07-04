# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, etc.) when working with code in this repository. CLAUDE.md is a symlink to this file.

## Core Principles (CRITICAL)

Respecting these principles is critical for every PR.

**Less is more. The simplest solution is the best solution.**

The action hierarchy for every change: **Delete > Replace > Add**. The best code change is a deletion. The second best is modifying what exists. Adding new code is the last resort.

1. **Minimal**: The simplest solution that works. Do not over-engineer, over-abstract, or add code just in case. Three similar lines beat a premature abstraction. Avoid error handling for impossible states, feature flags, compatibility shims, or policy scaffolding unless they are truly required.
2. **Solve at the source**: Do not hack fixes. Solve problems at their root. If something is broken, fix or remove the broken thing. Never patch over a broken abstraction, add workarounds, or add synchronization code for state that should not be duplicated.
3. **Delete ruthlessly**: When replacing code, delete what it replaced. Remove unused imports, functions, types, files, and commented-out code. Git preserves history. Run the repo's relevant dead-code or cleanup check when available.
4. **Replace > Add**: Modify existing code over adding new code. Edit existing files, extend existing components or functions with minimal parameters, and reuse existing utilities. If creating a new file, first prove it cannot fit cleanly in an existing file.
5. **Check existing**: Search the entire repo before creating anything new. If a feature, component, helper, responder, workflow, or utility already solves a similar problem, reuse or adapt it and delete the duplicate path.
6. **Deduplicate**: Do not duplicate existing code when updating the repo. Consolidate or refactor duplicates you find when it is in scope and low risk.
7. **Zero Regression**: Do not break existing features or workflows unless the PR intentionally removes them with evidence.
8. **Production ready**: All changes must be thoroughly debugged, validated, and production ready.

**When fixing bugs, ask: "What can I delete?" before "What can I replace?" before "What should I add?"**

## PR Workflow

After opening a PR:

1. Wait for the automated PR review and auto-format commit from Ultralytics Actions (`format.yml`), then pull and address every finding.
2. Launch an independent adversarial review agent with cold context (just the PR diff and this file) to hunt for bugs, regressions, and Core Principles violations — use the Codex CLI, one fresh `codex exec` run per round. Fix, push, and repeat until a fresh run reports LGTM.
3. Never fight other commits: Ultralytics Actions pushes auto-format and header commits, and multiple users may work on the same PR. `git pull --rebase` before pushing; never force-push, reset, or revert commits you did not author.
4. After the PR merges, clean up: remove local worktrees and branches for it, then `git checkout main && git pull`.

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

CI (`ci.yml`) runs the coverage command above on ubuntu/macos/windows × Python 3.9 and 3.13; `requires-python >=3.9` is the floor. Pytest `addopts` in pyproject.toml adds `--doctest-modules`, so docstring examples in the tested paths must run.

## Architecture

This repo ships the Ultralytics chat widget: `js/chat.js`, a single zero-dependency vanilla JS file (~1700 lines) defining the `UltralyticsChat` class (floating pill → modal with SSE-streamed chat, search mode via the `/chat`→`/search` URL swap, in-memory session ID from the `X-Session-ID` response header; localStorage stores only the pill position). It is delivered via jsDelivr CDN as `js/chat.min.js`. The Python package `ultralytics_llm` is a placeholder: `LLMClient.chat()` raises `NotImplementedError`, and only `__version__` and the constructor are real.

- `js/chat.min.js` is generated: `minify.yml` re-minifies and commits it on PRs that touch `js/chat.js` — never hand-edit it.
- `purge-cdn.yml` purges the jsDelivr cache on pushes to main touching `js/**` and after the "Tag and Release" workflow completes.
- Releases are manual: `tag.yml` is `workflow_dispatch`-only and gated to repo `ultralytics/llm` with actor `glenn-jocher`; it creates a git tag and GitHub release. There is no PyPI publish workflow.
- The package version lives in `ultralytics_llm/__init__.py` (`__version__`) and is read dynamically by setuptools.
- `vercel.json` redirects `/` to `/examples/web/demo` for the Vercel-hosted demo (`examples/web/demo.html`).

## Conventions

- Ultralytics Actions (`format.yml`) pushes auto-format commits to PR branches: Ruff + docformatter for Python, Prettier for YAML/JSON/Markdown, codespell, and AGPL-3.0 license headers — don't add or revert headers manually.
- Ruff config: line length 120, `target-version = "py310"`, Google docstring convention, `docstring-code-format = true`; only the `UP` lint rules are selected.
- JS style comes from `biome.json` (2-space indent, width 120, double quotes, semicolons); `format.yml` has `biome: false`, so run Biome locally if you touch `js/chat.js`.
- Tests live in `tests/` and run offline — no test hits the live network.
- To release: bump `__version__` in `ultralytics_llm/__init__.py`, merge, then run the "Tag and Release" workflow manually with the new tag name.
