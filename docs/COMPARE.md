# Visual README Comparison

`readme-forge compare` creates a self-contained HTML report that makes a proposed README update easy to review before any Markdown is overwritten. It can also emit Markdown and JSON summaries for GitHub issues, pull requests, and CI output.

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

## Share A Markdown Summary

Use `--format markdown` when you want a compact report that can be pasted into a GitHub issue, pull request comment, release checklist, or `$GITHUB_STEP_SUMMARY`:

```bash
npx github:danisantgry/readme-forge compare . --format markdown
```

Write the same summary to disk:

```bash
npx github:danisantgry/readme-forge compare . --format markdown --output reports/readme-summary.md
```

The Markdown summary includes project metadata, current and generated scores, missing checks, check-by-check status, additions, removals, and review commands.

See the committed [Vite Markdown comparison summary](../examples/report/vite-web.md).

## Use JSON In Automation

Use `--format json` for scripts and agents that need structured comparison data:

```bash
npx github:danisantgry/readme-forge compare . --format json
npx github:danisantgry/readme-forge compare . --format json --output reports/readme-summary.json
```

The JSON summary includes score data, quality checks, detected project metadata, changed status, improvement points, and line-change counts. It does not include full README source content.

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
- a focused diff with context around changes in the HTML report
- complete current and generated Markdown sources in the HTML report
- detected languages, frameworks, and package manager

The HTML report contains all CSS inline, requires no server, and uploads no project data. Project Markdown is HTML-escaped before rendering.

## Review Workflow

1. Generate the report with `readme-forge compare .`.
2. Open `readme-forge-report.html` locally.
3. Inspect quality changes and the focused diff.
4. Run `readme-forge compare . --format markdown` when you need a paste-ready review note.
5. Run `readme-forge . --diff` for a terminal review.
6. Write the generated README only when the proposed result is useful.

See the committed [Vite comparison example](../examples/report/vite-web.html) for a report generated from a fixture.
