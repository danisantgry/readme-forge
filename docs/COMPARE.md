# Visual README Comparison

`readme-forge compare` creates a self-contained HTML report that makes a proposed README update easy to review before any Markdown is overwritten.

## Create A Report

```bash
npx github:danisantgry/readme-forge compare .
```

The default output is `readme-forge-report.html` in the analyzed project. Choose a different destination with `--output`:

```bash
npx github:danisantgry/readme-forge compare . --output reports/readme.html
```

Use a non-standard README path with `--readme`:

```bash
npx github:danisantgry/readme-forge compare . --readme docs/PROJECT.md
```

Template, profile, badge, config, and optional AI settings are shared with the generator:

```bash
npx github:danisantgry/readme-forge compare . --template web --profile strict --no-badges
npx github:danisantgry/readme-forge compare . --ai
```

## What The Report Contains

- current and generated README quality scores
- percentage-point improvement
- passed and missing quality checks for both versions
- sequence-aware line additions and removals
- a focused diff with context around changes
- complete current and generated Markdown sources
- detected languages, frameworks, and package manager

The report contains all CSS inline, requires no server, and uploads no project data. Project Markdown is HTML-escaped before rendering.

## Review Workflow

1. Generate the report with `readme-forge compare .`.
2. Open `readme-forge-report.html` locally.
3. Inspect quality changes and the focused diff.
4. Run `readme-forge . --diff` for a terminal review.
5. Write the generated README only when the proposed result is useful.

See the committed [Vite comparison example](../examples/report/vite-web.html) for a report generated from a fixture.
