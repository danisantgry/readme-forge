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

Example:

```text
README quality score: 7/7 (100%)
README quality check passed.
```

Review generated README changes as a diff before writing:

```bash
npx github:danisantgry/readme-forge . --diff
```

## Features

- Detects project name, description, scripts, package manager, TypeScript, Vite, Next.js, React, Express, Python, Rust, and Go markers.
- Generates setup, scripts, testing, structure, and license sections.
- Supports custom output paths.
- Supports `cli`, `library`, and `web` template presets.
- Scores README quality across setup, scripts, testing, license, contribution, and security coverage.
- Supports diff reviews and JSON output for automation.
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

The check command returns a numeric score and lists missing sections when the README needs work:

```text
README quality score: 5/7 (71%)
missing-tests: Project has a test script, but README does not document testing.
missing-security: Project has SECURITY.md, but README does not link or mention it.
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

Use a template preset:

```bash
npm run dev -- . --template cli
npm run dev -- . --template library
npm run dev -- . --template web
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
- `prepublishOnly`: validate lint, build, and tests before publication.

## Testing

```bash
npm run lint
npm run build
npm test
npm audit
npm pack --dry-run
```

## Safety

The CLI reads project metadata and writes only the requested README output. API keys are read from the environment and are not written to disk.

## Example Output

See [`examples/node-library/README.generated.md`](examples/node-library/README.generated.md) for a generated README from a small TypeScript package.

## Maintainer Workflow

`readme-forge` is intended to support:

- first-pass README drafts for new repositories
- recurring README updates before releases
- contributor-friendly documentation reviews
- machine-readable checks for automation and agent workflows
- measurable README quality scoring for release gates
- optional AI refinement without making AI required for the project

## Feedback Wanted

If you maintain an open-source project, feedback is especially useful on:

- README sections that should be checked by `--check`
- ecosystem metadata that should be detected next
- workflows that should consume `--format json`
- scoring rules that should count toward README quality
- generated output that feels too generic or misses important context

Open feedback in [issue #5](https://github.com/danisantgry/readme-forge/issues/5).

## Roadmap

- npm publication under the `readme-forge` package name.
- More framework detectors for Rust, Go, Python, and package-manager-specific workflows.
- README templates for libraries, CLIs, and web apps.
- npm publishing and release workflow documentation.
- Configurable README quality scoring profiles for different project types.

## Contributing

Contributions are welcome. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md), and use the issue templates for bug reports or feature proposals.

## License

MIT
