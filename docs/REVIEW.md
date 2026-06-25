# README Review Bundles

`readme-forge review` creates a local review bundle for maintainers who want to evaluate a README update without overwriting project documentation.

## Create A Bundle

```bash
npx github:danisantgry/readme-forge review .
```

The default output folder is `readme-forge-review` inside the analyzed project.

Choose a different folder:

```bash
npx github:danisantgry/readme-forge review . --output reports/readme-review
```

Use a non-standard README path:

```bash
npx github:danisantgry/readme-forge review . --readme docs/PROJECT.md
```

Template, profile, score, badge, config, and optional AI settings are shared with the generator and doctor workflows:

```bash
npx github:danisantgry/readme-forge review . --template cli --profile strict --min-score 90
npx github:danisantgry/readme-forge review . --no-badges
npx github:danisantgry/readme-forge review . --ai
```

## Bundle Contents

The bundle contains:

- `README.md`: an index for the local review bundle
- `README.generated.md`: the generated README proposal
- `compare.html`: the visual before/after report
- `compare.md`: a paste-ready Markdown comparison summary
- `doctor.md`: the maintainer health report
- `PR_COMMENT.md`: a ready-to-edit pull request or issue comment
- `summary.json`: structured data for scripts and agents

The command writes only inside the requested output folder. It does not overwrite the project `README.md`.

## Maintainer Workflow

1. Run `readme-forge review .`.
2. Open `readme-forge-review/README.md`.
3. Inspect `compare.html` for visual review.
4. Copy `PR_COMMENT.md` into a GitHub issue or pull request when asking for feedback.
5. Use `README.generated.md` only when the generated result is better than the current README.

By default, the bundle is generated locally and no project data is uploaded. If you use `--ai` or set `"ai": true` in `readme-forge.config.json`, project metadata may be sent to the configured Gemini API.
