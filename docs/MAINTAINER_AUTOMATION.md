# Maintainer Automation Plan

`readme-forge` is designed to reduce repetitive documentation work for open-source maintainers.

## Near-Term Automation

- Generate README drafts from repository metadata before releases.
- Generate deterministic badges from repository, license, and package metadata.
- Diagnose README health and adoption gaps with `readme-forge doctor`.
- Maintain a generated gallery that shows output across common project shapes.
- Summarize workspace packages for monorepos without scanning deeply.
- Compare generated output with the committed README to identify stale sections.
- Suggest missing onboarding sections such as install, test, scripts, and license.
- Fail CI when README quality drops below a configured score.
- Share versioned defaults through `readme-forge.config.json`.
- Scaffold adoption kits with config and optional GitHub Actions workflows.
- Choose quality profiles for lightweight, standard, maintainer, or strict documentation gates.
- Support optional AI refinement when a maintainer explicitly opts in.

## How Codex Would Help

Codex can support maintenance by:

- reviewing parser and template changes
- drafting tests for new framework detectors
- expanding monorepo and workspace fixtures
- keeping generated examples synchronized with detector and template behavior
- keeping badge generation deterministic and metadata-backed
- triaging issues into detector, template, CLI, and documentation categories
- preparing release notes from merged changes
- improving doctor recommendations from real maintainer workflows
- maintaining quality gate thresholds as the checker gets smarter
- proposing config defaults for different project types
- improving the `init` adoption flow for common maintainer setups
- tuning quality profiles for different repository maturity levels
- checking that AI-assisted output does not invent unsupported project capabilities

## Guardrails

- Offline generation must always work.
- External AI calls must remain opt-in.
- Secrets must stay in environment variables.
- Generated docs should be grounded in detected repository facts.
- CI checks should be deterministic and work without external services.
