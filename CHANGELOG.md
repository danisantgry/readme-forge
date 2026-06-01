# Changelog

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
