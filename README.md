# readme-forge

[![Release](https://img.shields.io/github/v/release/danisantgry/readme-forge?label=release)](https://github.com/danisantgry/readme-forge/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Issues](https://img.shields.io/github/issues/danisantgry/readme-forge)](https://github.com/danisantgry/readme-forge/issues)
[![Try with npx](https://img.shields.io/badge/try-npx%20github%3Adanisantgry%2Freadme--forge-blue)](#install)

`readme-forge` is a TypeScript CLI that inspects a project folder and generates a clean, practical `README.md`. It works offline with local templates and can optionally ask Gemini to refine the output when `GEMINI_API_KEY` is present.

![readme-forge terminal demo](docs/demo.svg)

## Why It Exists

Many open-source projects have useful code but incomplete onboarding. `readme-forge` helps maintainers keep project documentation accurate by generating README drafts from real repository metadata instead of blank-page guessing.

## Quick Try

Preview a README for the current folder without writing files:

```bash
npx github:danisantgry/readme-forge . --dry-run
```

Check whether an existing README is missing common maintainer sections:

```bash
npx github:danisantgry/readme-forge . --check
```

Run a full README health diagnosis:

```bash
npx github:danisantgry/readme-forge doctor .
```

Save a shareable Markdown health report:

```bash
npx github:danisantgry/readme-forge doctor . --report docs/readme-health.md
```

Require a minimum score for CI:

```bash
npx github:danisantgry/readme-forge . --check --min-score 90
```

Preview a repository adoption kit before writing files:

```bash
npx github:danisantgry/readme-forge init . --github-actions --dry-run
```

Example:

```text
README quality score: 7/7 (100%)
Minimum score: 90%
README quality check passed.
```

Review generated README changes as a diff before writing:

```bash
npx github:danisantgry/readme-forge . --diff
```

Browse generated examples:

- [TypeScript CLI](examples/gallery/typescript-cli/README.generated.md)
- [Vite web app](examples/gallery/vite-web/README.generated.md)
- [npm workspace](examples/gallery/npm-workspace/README.generated.md)
- [Python package](examples/gallery/python-package/README.generated.md)
- [Rust crate](examples/gallery/rust-crate/README.generated.md)
- [Go module](examples/gallery/go-module/README.generated.md)

See the full [generated README gallery](docs/GALLERY.md).

## Features

- Detects project name, description, scripts, package manager, npm/pnpm/yarn workspaces, TypeScript, Vite, Next.js, React, Express, Python, Rust, and Go markers.
- Generates setup, scripts, testing, structure, and license sections.
- Supports custom output paths.
- Supports `cli`, `library`, and `web` template presets.
- Supports `readme-forge.config.json` for repeatable repository defaults.
- Supports `basic`, `standard`, `maintainer`, and `strict` quality profiles.
- Generates deterministic release, issues, license, and npm badges when metadata is available.
- Scaffolds `readme-forge.config.json` and an optional GitHub Actions README quality gate with `readme-forge init`.
- Diagnoses README health, adoption status, generated diff status, and ecosystem-aware next actions with `readme-forge doctor`.
- Exports shareable Markdown doctor reports with `readme-forge doctor --report`.
- Scores README quality across setup, scripts, testing, license, contribution, and security coverage.
- Supports minimum score gates for CI with `--min-score`.
- Supports diff reviews and JSON output for automation.
- Includes fixture-based regression tests for TypeScript, Vite, Python, Rust, Go, and workspace project shapes.
- Includes a generated README gallery for comparing output across real project shapes.
- Optional Gemini enhancement through environment variables only.
- Never stores API keys in generated files.
- Designed for maintainer workflows where README updates should be repeatable, reviewable, and safe.

## Install

Run directly from GitHub:

```bash
npx github:danisantgry/readme-forge . --dry-run
```

After npm publication:

```bash
npx readme-forge .
```

For local development:

```bash
npm install
npm run build
```

## Usage

Generate or replace `README.md`:

```bash
npm run dev -- .
```

Write to a separate file:

```bash
npm run dev -- . --output README.generated.md
```

Preview without writing:

```bash
npm run dev -- . --dry-run
```

Check README quality:

```bash
npm run dev -- . --check
```

Run a maintainer-oriented diagnosis:

```bash
npm run dev -- doctor .
npm run dev -- doctor . --format json
npm run dev -- doctor . --report docs/readme-health.md
npm run dev -- doctor . --min-score 90
```

The doctor command reports detected project metadata, README score, generated diff status, config adoption, GitHub Actions adoption, and recommended next actions. Recommendations can include package-manager commands, workspace summaries, non-Node test commands, and CLI/web/library example templates. Use `--report` to save the same diagnosis as Markdown for issues, pull requests, release prep, or project documentation. See [`docs/DOCTOR.md`](docs/DOCTOR.md).

The check command returns a numeric score and lists missing sections when the README needs work:

```text
README quality score: 5/7 (71%)
missing-tests: Project has a test script, but README does not document testing.
missing-security: Project has SECURITY.md, but README does not link or mention it.
```

Use a minimum score gate:

```bash
npm run dev -- . --check --min-score 90
```

Use a quality profile:

```bash
npm run dev -- . --check --profile strict
```

Review changes without overwriting README:

```bash
npm run dev -- . --diff
```

Emit machine-readable output for automation:

```bash
npm run dev -- . --dry-run --format json
npm run dev -- . --check --format json
```

The JSON check output includes `ok`, `quality.score`, `quality.maxScore`, `quality.percentage`, `quality.issues`, `quality.passedChecks`, and detected project facts.

For CI, combine JSON output with a minimum score:

```bash
npm run dev -- . --check --min-score 90 --format json
```

Use a template preset:

```bash
npm run dev -- . --template cli
npm run dev -- . --template library
npm run dev -- . --template web
```

Use repository defaults:

```json
{
  "template": "cli",
  "profile": "maintainer",
  "badges": true,
  "minScore": 90,
  "format": "json"
}
```

See [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) for supported config fields and precedence rules.

Initialize a repeatable adoption kit:

```bash
npm run dev -- init . --github-actions --dry-run
npm run dev -- init . --github-actions
```

The init command creates `readme-forge.config.json` and, when requested, `.github/workflows/readme-quality.yml`. Existing files are protected unless `--force` is used. See [`docs/ADOPTION_KIT.md`](docs/ADOPTION_KIT.md) for the full setup flow.

Disable generated badges when needed:

```bash
npm run dev -- . --dry-run --no-badges
```

Use Gemini refinement:

```bash
set GEMINI_API_KEY=your-key
npm run dev -- . --ai
```

Optional model override:

```bash
set GEMINI_MODEL=gemini-2.5-flash-lite
```

## Scripts

- `dev`: run the CLI from TypeScript source with `tsx`.
- `build`: compile TypeScript into `dist/`.
- `test`: run the Vitest suite.
- `lint`: type-check without emitting files.
- `check:readme`: run the README quality gate at 90%.
- `examples:generate`: regenerate the committed example gallery from fixtures.
- `examples:check`: verify the committed example gallery is in sync.
- `doctor`: run the documentation health report against this repository.
- `prepublishOnly`: validate lint, build, tests, generated examples, and doctor output before publication.

## Testing

```bash
npm run lint
npm run build
npm test
npm run check:readme
npm run examples:check
npm run doctor
npm audit
npm pack --dry-run
```

The fixture regression suite is documented in [`docs/FIXTURES.md`](docs/FIXTURES.md).

Workspace repositories are summarized with package manager, workspace patterns, and detected package names when `package.json` workspaces or `pnpm-workspace.yaml` are present.

## GitHub Actions

Use [`docs/GITHUB_ACTIONS.md`](docs/GITHUB_ACTIONS.md) for a ready-to-copy workflow that fails a job when the README quality score is below 90%. This repository dogfoods the same gate locally through `npm run check:readme`.

To scaffold the workflow in another repository:

```bash
npx github:danisantgry/readme-forge init . --github-actions
```

## Safety

The CLI reads project metadata and writes only the requested README output. API keys are read from the environment and are not written to disk.

## Example Output

See [`examples/node-library/README.generated.md`](examples/node-library/README.generated.md) for a generated README from a small TypeScript package.

For a broader comparison, see [`docs/GALLERY.md`](docs/GALLERY.md), which links generated output for TypeScript CLI, Vite, npm workspace, Python, Rust, and Go project shapes.

For repository health checks, see [`docs/DOCTOR.md`](docs/DOCTOR.md).

## Maintainer Workflow

`readme-forge` is intended to support:

- first-pass README drafts for new repositories
- recurring README updates before releases
- documentation health checks before publishing or asking for review
- contributor-friendly documentation reviews
- machine-readable checks for automation and agent workflows
- measurable README quality scoring for release gates
- GitHub Actions-ready quality gates for README regressions
- versioned configuration for teams and repeatable CI defaults
- 60-second adoption kits that create config and CI guardrails without hand-copying YAML
- profile-based quality checks for different repository maturity levels
- fixture-based regression coverage for ecosystem detectors
- generated examples that make output quality visible before installation
- doctor reports that turn README quality, ecosystem metadata, and adoption gaps into next actions
- shareable Markdown health reports for issues, PRs, and maintainer handoffs
- workspace summaries for monorepos without deep repository scans
- deterministic README badges for release, issues, license, and npm package status
- optional AI refinement without making AI required for the project

## Feedback Wanted

If you maintain an open-source project, feedback is especially useful on:

- README sections that should be checked by `--check`
- ecosystem metadata that should be detected next
- workspace layouts that should be summarized more precisely
- workflows that should consume `--format json`
- scoring rules that should count toward README quality
- config fields that would make repository adoption easier
- profile rules that should be stricter or more forgiving
- badge metadata that should be supported next
- adoption defaults that should be included in `readme-forge init`
- generated output that feels too generic or misses important context
- additional project shapes that should appear in the generated gallery
- doctor recommendations that should support additional ecosystems

Open feedback in [issue #5](https://github.com/danisantgry/readme-forge/issues/5).

## Roadmap

- npm publication under the `readme-forge` package name.
- More ecosystem fixtures and package-manager-specific workflows.
- Richer monorepo package summaries.
- README templates for libraries, CLIs, and web apps.
- npm publishing and release workflow documentation.
- More configurable README quality scoring profiles for different project types.
- Gallery screenshots or richer before/after documentation examples.
- More ecosystem-aware doctor recommendations.

## Contributing

Contributions are welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md), and use the issue templates for bug reports or feature proposals.

## License

MIT
