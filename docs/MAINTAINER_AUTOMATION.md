# Maintainer Automation Plan

`readme-forge` is designed to reduce repetitive documentation work for open-source maintainers.

## Near-Term Automation

- Generate README drafts from repository metadata before releases.
- Compare generated output with the committed README to identify stale sections.
- Suggest missing onboarding sections such as install, test, scripts, and license.
- Fail CI when README quality drops below a configured score.
- Support optional AI refinement when a maintainer explicitly opts in.

## How Codex Would Help

Codex can support maintenance by:

- reviewing parser and template changes
- drafting tests for new framework detectors
- triaging issues into detector, template, CLI, and documentation categories
- preparing release notes from merged changes
- maintaining quality gate thresholds as the checker gets smarter
- checking that AI-assisted output does not invent unsupported project capabilities

## Guardrails

- Offline generation must always work.
- External AI calls must remain opt-in.
- Secrets must stay in environment variables.
- Generated docs should be grounded in detected repository facts.
- CI checks should be deterministic and work without external services.
