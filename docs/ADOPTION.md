# Adoption Plan

This document keeps adoption work honest and measurable. The goal is to earn real usage through a useful tool, clear docs, and maintainable behavior.

## Target Users

- maintainers starting new open-source repositories
- developers cleaning up README files before releases
- contributors who want a repeatable docs baseline
- students and indie builders publishing first projects

## Launch Channels

- GitHub repository README and release notes
- npm package page after publishing
- short posts in developer communities asking for feedback
- direct use on small public repositories owned by the maintainer
- GitHub release tarball while npm publication is pending

## Feedback Request

```text
I built readme-forge, a small TypeScript CLI that generates README drafts from real project metadata. It works offline, has optional Gemini refinement, supports readme-forge.config.json defaults, and includes scored --check reports with --min-score gates for CI. I'm looking for honest feedback from maintainers on what README sections should be detected next.

Repo: https://github.com/danisantgry/readme-forge
```

## Metrics To Track

- GitHub stars and forks
- issues opened by real users
- npm downloads after publication
- release count and changelog quality
- number of supported ecosystems and fixtures
- successful public `npx github:danisantgry/readme-forge` smoke tests
- passing README quality gate on push and pull requests
- repositories using a committed `readme-forge.config.json`

## Do Not Do

- Do not buy stars or use fake accounts.
- Do not claim downloads or adoption before they exist.
- Do not submit the OpenAI form with invented metrics.
