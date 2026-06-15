# GitHub Actions Quality Gate

Use this workflow in repositories that want `readme-forge` to enforce a README quality baseline on push and pull requests.

Before adding CI, run a local diagnosis:

```bash
npx github:danisantgry/readme-forge doctor . --min-score 90
```

The quickest path is to let `readme-forge` scaffold it:

```bash
npx github:danisantgry/readme-forge init . --github-actions --dry-run
npx github:danisantgry/readme-forge init . --github-actions
```

Existing workflow files are protected unless `--force` is used.

```yaml
name: README Quality

on:
  push:
    branches:
      - main
  pull_request:

permissions:
  contents: read

jobs:
  readme-quality:
    name: README quality gate
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm

      - name: Check README quality
        run: npx github:danisantgry/readme-forge . --check --min-score 90 --format json
```

For this repository, the same gate can be run locally with:

```bash
npm run check:readme
```
