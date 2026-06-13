# Adoption Kit

`readme-forge init` helps maintainers add repeatable README checks to a repository in about a minute.

It creates a safe local configuration file and can also scaffold a GitHub Actions workflow for README quality gates.

## Preview First

Always start with a dry run:

```bash
npx github:danisantgry/readme-forge init . --github-actions --dry-run
```

The command prints the files it would create without writing anything.

## Create The Kit

```bash
npx github:danisantgry/readme-forge init . --github-actions
```

Generated files:

- `readme-forge.config.json`
- `.github/workflows/readme-quality.yml` when `--github-actions` is present

Existing files are protected by default. Use `--force` only when you intentionally want to replace an existing config or workflow.

## Recommended Settings

```bash
npx github:danisantgry/readme-forge init . --github-actions --profile maintainer --min-score 90
```

Useful variants:

```bash
npx github:danisantgry/readme-forge init --path ./my-project --github-actions
npx github:danisantgry/readme-forge init . --template cli
npx github:danisantgry/readme-forge init . --template library
npx github:danisantgry/readme-forge init . --template web
npx github:danisantgry/readme-forge init . --profile strict --min-score 95
npx github:danisantgry/readme-forge init . --no-badges
```

## Generated Config

The default config is intentionally small:

```json
{
  "template": "auto",
  "profile": "maintainer",
  "badges": true,
  "minScore": 90,
  "format": "json",
  "ai": false
}
```

This keeps README checks deterministic and offline by default. Optional AI refinement remains opt-in through `GEMINI_API_KEY`.

## Workflow Behavior

The generated GitHub Actions workflow:

- runs on README-related pull requests and pushes to `main`
- checks out the repository
- sets up Node.js 20
- runs `readme-forge --check` with the configured minimum score and profile

This gives maintainers a visible quality gate without adding a custom build system or remote service.
