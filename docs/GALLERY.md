# Generated README Gallery

This gallery shows deterministic README output generated from real fixture-style project shapes.

Each example is regenerated from local metadata with `npm run examples:generate`, so visitors can inspect the output before trying the CLI on their own repositories.

| Example | Template | Detected Shape | Preview Command |
| --- | --- | --- | --- |
| [TypeScript CLI](../examples/gallery/typescript-cli/README.generated.md) | `cli` | TypeScript, JavaScript | `npm run dev -- test/fixtures/typescript-cli --dry-run --template cli --no-badges` |
| [Vite Web App](../examples/gallery/vite-web/README.generated.md) | `web` | TypeScript, JavaScript; Vite | `npm run dev -- test/fixtures/vite-web --dry-run --template web --no-badges` |
| [npm Workspace](../examples/gallery/npm-workspace/README.generated.md) | `auto` | JavaScript; 2 workspace packages | `npm run dev -- test/fixtures/npm-workspace --dry-run --template auto --no-badges` |
| [Python Package](../examples/gallery/python-package/README.generated.md) | `library` | Python; Python package | `npm run dev -- test/fixtures/python-package --dry-run --template library --no-badges` |
| [Rust Crate](../examples/gallery/rust-crate/README.generated.md) | `library` | Rust; Rust crate | `npm run dev -- test/fixtures/rust-crate --dry-run --template library --no-badges` |
| [Go Module](../examples/gallery/go-module/README.generated.md) | `library` | Go; Go module | `npm run dev -- test/fixtures/go-module --dry-run --template library --no-badges` |

## Visual Comparison Report

Open the committed [Vite README comparison report](../examples/report/vite-web.html) to inspect the score change, quality checks, focused diff, and complete sources produced by `readme-forge compare`.

## Regenerate

```bash
npm run build
npm run examples:generate
npm run examples:check
```

## Why This Matters

The examples make `readme-forge` easier to evaluate from the repository page:

- maintainers can compare output across CLI, web, workspace, Python, Rust, and Go projects
- contributors get concrete fixtures for template and detector improvements
- reviewers can verify that generated docs are grounded in detected project metadata
