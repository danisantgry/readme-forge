# Fixture Regression Suite

`readme-forge` keeps a small set of representative fixture projects under `test/fixtures/`.

These fixtures protect the analyzer, generator, and README quality score from regressions as new ecosystems are added.

They also power the generated examples in [`GALLERY.md`](GALLERY.md).

## Current Fixtures

- `typescript-cli`: npm package with TypeScript, CLI entrypoint, scripts, and MIT license.
- `vite-web`: Vite-style web app with TypeScript and common development scripts.
- `python-package`: Python package metadata from `pyproject.toml`.
- `rust-crate`: Rust crate metadata from `Cargo.toml`.
- `go-module`: Go module metadata from `go.mod`.
- `npm-workspace`: npm workspace metadata from `package.json`.
- `pnpm-workspace`: pnpm workspace metadata from `pnpm-workspace.yaml`.

## What Tests Assert

The fixture tests verify that each project:

- produces the expected project name
- detects the expected language and framework marker
- detects workspace manager, patterns, and package summaries when applicable
- detects maintainer signals such as CLI bins, entrypoints, config files, env examples, Docker files, Makefile, and GitHub Actions workflows
- generates a README with setup and testing sections
- generates metadata-backed Usage, Configuration, Package Entrypoints, and Automation sections when signals exist
- produces a 100% README quality score for generated output

## Generated Gallery

Regenerate the committed gallery after changing fixtures, detectors, or templates:

```bash
npm run build
npm run examples:generate
npm run examples:check
```

## Adding A Fixture

Add the smallest realistic project shape that exercises a detector or template decision. Keep fixture files tiny and avoid generated dependency folders.

Good fixture additions usually include:

- the ecosystem manifest, such as `package.json`, `pyproject.toml`, `Cargo.toml`, or `go.mod`
- one source file
- scripts or metadata that should appear in the generated README
- a test expectation in `test/generator.test.ts`
