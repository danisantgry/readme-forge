# Configuration

`readme-forge` can read defaults from `readme-forge.config.json` in the project root.

CLI flags always override config values.

To create a starter config safely, run:

```bash
readme-forge init . --dry-run
readme-forge init .
```

See [`ADOPTION_KIT.md`](ADOPTION_KIT.md) for the full setup flow, including GitHub Actions scaffolding.

## Example

```json
{
  "template": "cli",
  "profile": "maintainer",
  "badges": true,
  "output": "README.generated.md",
  "format": "json",
  "minScore": 90,
  "ai": false
}
```

## Fields

- `template`: one of `auto`, `cli`, `library`, or `web`.
- `profile`: one of `basic`, `standard`, `maintainer`, or `strict`.
- `badges`: boolean that enables or disables generated badges.
- `output`: README output path, resolved relative to the project root.
- `format`: one of `markdown` or `json`.
- `minScore`: integer from 0 to 100, used by `--check`.
- `ai`: boolean that enables optional Gemini refinement when `GEMINI_API_KEY` is present.

## Custom Config Path

Use `--config` when a repository needs a non-default path:

```bash
readme-forge . --config docs/readme-forge.config.json --check
```

## CI Usage

Config files work well with README quality gates:

```bash
readme-forge . --check
```

With this config:

```json
{
  "minScore": 90,
  "format": "json"
}
```

the command emits machine-readable output and fails when the README score is below 90%.

## Quality Profiles

- `basic`: title, setup, and license.
- `standard`: `basic` plus scripts and testing.
- `maintainer`: `standard` plus contribution and security policy links when those files exist. This is the default.
- `strict`: `maintainer` plus changelog or release-notes coverage when `CHANGELOG.md` exists.

## Badges

Badges are enabled by default for generated README output. Use `badges: false` or `--no-badges` when a repository prefers a plain README.

Generated badges are deterministic and based only on detected metadata:

- GitHub release badge when a GitHub repository URL is present.
- GitHub issues badge when a GitHub repository URL is present.
- License badge when license metadata exists.
- npm version badge when a public npm package name exists.
