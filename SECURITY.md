# Security Policy

## Supported Versions

The current `main` branch and latest GitHub release receive security fixes.

## Reporting a Vulnerability

Please open a private security advisory on GitHub or contact the maintainer through the repository owner profile. Do not include secrets in public issues.

## Secret Handling

`readme-forge` reads optional AI credentials from environment variables only:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`

The project should never write API keys into generated README files, logs, examples, or tests.

## Threat Model

The CLI reads local project metadata and writes a requested README output file. Contributors should be careful with changes that:

- read arbitrary files beyond project metadata
- follow symlinks into unexpected locations
- transmit source code to external services without an explicit opt-in flag
- persist environment variables or API responses containing secrets
