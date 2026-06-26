# Safe README Apply

`readme-forge apply` applies the `README.generated.md` from a review bundle to the project README after safety checks.

## Apply A Reviewed README

Create a review bundle first:

```bash
npx github:danisantgry/readme-forge review .
```

Preview the apply step without writing files:

```bash
npx github:danisantgry/readme-forge apply . --dry-run
```

Apply the reviewed README:

```bash
npx github:danisantgry/readme-forge apply .
```

By default, the command reads from `readme-forge-review`.

Use a different bundle folder:

```bash
npx github:danisantgry/readme-forge apply . --from reports/readme-review
```

Apply to a non-standard README path:

```bash
npx github:danisantgry/readme-forge apply . --readme docs/PROJECT.md
```

## Safety Behavior

`apply` is intentionally conservative:

- verifies the generated README hash from `summary.json`
- refuses to apply if the project README changed after the review bundle was created
- creates a backup beside the target README before writing
- supports `--dry-run` so maintainers can preview the action
- reports "already matches" if the target README already contains the generated content

If the README changed after review and you still want to apply the bundle, inspect the diff first and then use:

```bash
npx github:danisantgry/readme-forge apply . --force
```

## Backup Files

Backups are written beside the target README:

```text
README.md.readme-forge-backup
README.md.readme-forge-backup.1
```

The default `.gitignore` entry prevents these backups from being committed accidentally.

## Recommended Workflow

1. Run `readme-forge review .`.
2. Inspect `readme-forge-review/compare.html`.
3. Run `readme-forge apply . --dry-run`.
4. Run `readme-forge apply .` only after reviewing the generated README.
5. Run your project tests before committing the README update.
