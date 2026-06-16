# README Doctor

`readme-forge doctor` audits a repository's README health and adoption status.

It is designed for maintainers who want a quick answer to:

- what project shape was detected?
- does the README meet the selected quality profile?
- would generated output differ from the current README?
- has the repository adopted `readme-forge.config.json`?
- is there a README quality workflow in `.github/workflows/`?
- what should be fixed next?

## Basic Usage

```bash
npx github:danisantgry/readme-forge doctor .
```

Example output:

```text
readme-forge doctor

Project: my-cli
Detected: TypeScript, JavaScript; package manager: npm

README
- OK README.md
- Score: 7/7 (100%)
- Profile: maintainer
- Generated diff: in sync

Adoption
- OK readme-forge.config.json
- TODO README workflow: not found

Recommended next actions
- Add a README quality workflow so pull requests cannot silently regress documentation.
  readme-forge init . --github-actions --dry-run

Status: ready with follow-ups
```

## JSON Output

```bash
npx github:danisantgry/readme-forge doctor . --format json
```

The JSON report includes:

- `facts`: detected project metadata
- `readme.quality`: scored quality report
- `readme.changedFromGenerated`: whether `--diff` would show changes
- `adoption`: config and workflow status
- `recommendations`: actionable next steps
- `ok`: whether README, generated output, config, and workflow are all in a ready state

## Ecosystem-Aware Recommendations

Doctor recommendations are grounded in detected project metadata.

For Node projects, the report can suggest package-manager-specific commands:

```text
npm install
npm run dev
npm run build
npm run test
```

For pnpm and yarn projects, the same recommendations use the detected package manager.

For workspaces, the report can recommend documenting detected workspace packages and paths:

```text
readme-forge . --template auto --dry-run
```

For non-Node ecosystems, the report can suggest common contributor setup and test commands:

```text
python -m pip install -e .
python -m pytest
cargo build
cargo test
go mod download
go test ./...
```

For project shape, the report can recommend a focused example template:

```text
readme-forge . --template cli --dry-run
readme-forge . --template web --dry-run
readme-forge . --template library --dry-run
```

## Score Gates

Use `--min-score` when the doctor command should fail in automation if the README quality score is too low:

```bash
npx github:danisantgry/readme-forge doctor . --min-score 90
```

The command exits with a non-zero status only when a provided minimum score fails. The report can still show adoption recommendations even when the score passes.

## Profiles

```bash
npx github:danisantgry/readme-forge doctor . --profile basic
npx github:danisantgry/readme-forge doctor . --profile standard
npx github:danisantgry/readme-forge doctor . --profile maintainer
npx github:danisantgry/readme-forge doctor . --profile strict
```

Profiles match the same rules used by `readme-forge --check`.

## Adoption Flow

A useful first-time setup flow is:

```bash
npx github:danisantgry/readme-forge doctor .
npx github:danisantgry/readme-forge init . --github-actions --dry-run
npx github:danisantgry/readme-forge init . --github-actions
npx github:danisantgry/readme-forge doctor . --min-score 90
```

This gives maintainers a safe preview, versioned defaults, CI guardrails, and a final health report.
