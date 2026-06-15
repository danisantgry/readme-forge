# Dogfooding Notes

These notes track real usage of `readme-forge` against local projects.

## Public GitHub Install Smoke Test

Command:

```bash
npx github:danisantgry/readme-forge . --dry-run
```

Result:

- Successfully generated README output from a temporary sample project.
- Confirmed the committed `dist/` build allows GitHub-based `npx` usage before npm publication.

## Local Validation

Commands:

```bash
npm run lint
npm run build
npm test
npm run check:readme
npm run examples:check
npx github:danisantgry/readme-forge doctor . --min-score 90
npm audit
npm pack --dry-run
```

Result:

- TypeScript passes.
- Tests pass.
- README quality passes at the configured 90% minimum score.
- Generated gallery output stays in sync with fixtures.
- The doctor command reports README score, generated diff status, config adoption, and remaining workflow adoption work.
- npm audit reports 0 vulnerabilities.
- npm package tarball is generated successfully.

## Repository Config

The repository dogfoods `readme-forge.config.json` with maintainer profile defaults:

```json
{
  "template": "cli",
  "profile": "maintainer",
  "badges": true,
  "minScore": 90,
  "ai": false
}
```
