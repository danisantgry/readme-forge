# Configuration

`readme-forge` can read defaults from `readme-forge.config.json` in the project root.

CLI flags always override config values.

## Example

```json
{
  "template": "cli",
  "output": "README.generated.md",
  "format": "json",
  "minScore": 90,
  "ai": false
}
```

## Fields

- `template`: one of `auto`, `cli`, `library`, or `web`.
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
