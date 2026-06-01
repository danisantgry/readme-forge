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
npm audit
npm pack --dry-run
```

Result:

- TypeScript passes.
- Tests pass.
- npm audit reports 0 vulnerabilities.
- npm package tarball is generated successfully.
