# Changelog

## 0.11.0 - 2026-06-12

- Added `readme-forge init` for creating repository adoption kits.
- Added safe config scaffolding for `readme-forge.config.json`.
- Added optional GitHub Actions workflow scaffolding with `--github-actions`.
- Added `--dry-run`, `--force`, `--min-score`, `--profile`, `--template`, and `--no-badges` controls for init workflows.
- Added adoption kit documentation and tests for init planning, dry runs, writing, and overwrite protection.
- Included docs and examples in package files for a complete npm README experience.
- Updated dev tooling dependencies so `npm audit` reports no known vulnerabilities.

## 0.10.0 - 2026-06-11

- Added deterministic badge generation for GitHub releases, GitHub issues, license, and npm package status.
- Added `--badges` and `--no-badges` controls for generated README output.
- Added `badges` support in `readme-forge.config.json`.
- Added repository metadata extraction from package manifests.
- Increased Vitest timeout for end-to-end CLI subprocess tests.

## 0.9.0 - 2026-06-09

- Added detection for npm, pnpm, and yarn workspace repositories.
- Added workspace package summaries for simple `packages/*`, `apps/*`, and similar one-level patterns.
- Added README generation for workspace package lists.
- Added fixtures and tests for `package.json` workspaces and `pnpm-workspace.yaml`.

## 0.8.0 - 2026-06-08

- Added README quality profiles: `basic`, `standard`, `maintainer`, and `strict`.
- Added `--profile` for CLI-driven quality checks.
- Added `profile` support in `readme-forge.config.json`.
- Added strict changelog coverage checks when `CHANGELOG.md` exists.
- Added tests for profile depth and config-driven profile selection.

## 0.7.0 - 2026-06-06

- Added `readme-forge.config.json` support for repeatable repository defaults.
- Added `--config` for custom configuration file paths.
- Added typed config validation and CLI-over-config precedence.
- Added tests for config parsing, config-driven checks, and flag overrides.
- Added configuration documentation and an example config file.

## 0.6.0 - 2026-06-04

- Added fixture-based regression coverage for TypeScript CLI, Vite web app, Python package, Rust crate, and Go module project shapes.
- Added analyzer support for reading project name, description, and license from `pyproject.toml` and `Cargo.toml`.
- Added analyzer support for deriving Go module names from `go.mod`.
- Added fixture documentation for future ecosystem coverage.

## 0.5.0 - 2026-06-03

- Added `--min-score` for CI-friendly README quality gates.
- Added `check:readme` npm script for local and automated validation.
- Added a GitHub Actions recipe for running README quality gates on push and pull requests.
- Added tests for minimum score pass/fail behavior.

## 0.4.0 - 2026-06-02

- Added numeric README quality scoring for `--check`.
- Added detailed JSON quality reports with score, percentage, passed checks, and issues.
- Added checks for contribution and security documentation when `CONTRIBUTING.md` or `SECURITY.md` exist.
- Added CLI tests for scored quality output.

## 0.3.0 - 2026-06-01

- Added `--diff` for reviewing generated README changes without overwriting files.
- Added `--format json` for automation-friendly dry-run, check, and diff output.
- Added CLI tests for JSON output and diff review.

## 0.2.1 - 2026-06-01

- Added committed build output so the CLI can be tested directly from GitHub before npm publication.
- Updated installation docs with `npx github:danisantgry/readme-forge`.

## 0.2.0 - 2026-06-01

- Added `--dry-run` to preview generated README output without writing files.
- Added `--check` to report missing maintainer-oriented README sections.
- Added `--template auto|cli|library|web` presets.
- Added Rust and Go metadata detection.
- Added npm publishing metadata and `prepublishOnly` validation.
- Added adoption docs and launch copy for community feedback.

## 0.1.0 - 2026-06-01

- Added TypeScript CLI for generating README files from project metadata.
- Added offline README template generation.
- Added optional Gemini refinement through `GEMINI_API_KEY`.
- Added detection for npm projects, TypeScript, Vite, Next.js, React, Express, and Python markers.
- Added tests for metadata analysis and README generation.
- Added contribution and security documentation.
