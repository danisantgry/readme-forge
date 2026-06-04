# Fixture Regression Suite

`readme-forge` keeps a small set of representative fixture projects under `test/fixtures/`.

These fixtures protect the analyzer, generator, and README quality score from regressions as new ecosystems are added.

## Current Fixtures

- `typescript-cli`: npm package with TypeScript, CLI entrypoint, scripts, and MIT license.
- `vite-web`: Vite-style web app with TypeScript and common development scripts.
- `python-package`: Python package metadata from `pyproject.toml`.
- `rust-crate`: Rust crate metadata from `Cargo.toml`.
- `go-module`: Go module metadata from `go.mod`.

## What Tests Assert

The fixture tests verify that each project:

- produces the expected project name
- detects the expected language and framework marker
- generates a README with setup and testing sections
- produces a 100% README quality score for generated output

## Adding A Fixture

Add the smallest realistic project shape that exercises a detector or template decision. Keep fixture files tiny and avoid generated dependency folders.

Good fixture additions usually include:

- the ecosystem manifest, such as `package.json`, `pyproject.toml`, `Cargo.toml`, or `go.mod`
- one source file
- scripts or metadata that should appear in the generated README
- a test expectation in `test/generator.test.ts`
