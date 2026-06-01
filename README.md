# readme-forge

`readme-forge` is a TypeScript CLI that inspects a project folder and generates a clean, practical `README.md`. It works offline with local templates and can optionally ask Gemini to refine the output when `GEMINI_API_KEY` is present.

## Features

- Detects project name, description, scripts, package manager, TypeScript, Vite, Next.js, React, Express, and Python markers.
- Generates setup, scripts, testing, structure, and license sections.
- Supports custom output paths.
- Optional Gemini enhancement through environment variables only.
- Never stores API keys in generated files.

## Install

```bash
npm install
npm run build
```

## Usage

Generate or replace `README.md`:

```bash
npm run dev -- .
```

Write to a separate file:

```bash
npm run dev -- . --output README.generated.md
```

Use Gemini refinement:

```bash
set GEMINI_API_KEY=your-key
npm run dev -- . --ai
```

Optional model override:

```bash
set GEMINI_MODEL=gemini-2.5-flash-lite
```

## Safety

The CLI reads project metadata and writes only the requested README output. API keys are read from the environment and are not written to disk.

## Roadmap

- More framework detectors.
- README templates for libraries, CLIs, and web apps.
- Badge generation.
