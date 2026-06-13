import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
function configContent(options) {
    return `${JSON.stringify({
        template: options.template ?? "auto",
        profile: options.profile ?? "maintainer",
        badges: options.badges !== false,
        minScore: options.minScore ?? 90,
        format: "json",
        ai: false
    }, null, 2)}\n`;
}
function workflowContent(options) {
    const minScore = options.minScore ?? 90;
    const profile = options.profile ?? "maintainer";
    return `name: README quality

on:
  pull_request:
    paths:
      - "README.md"
      - "readme-forge.config.json"
      - "package.json"
      - "pnpm-workspace.yaml"
      - ".github/workflows/readme-quality.yml"
  push:
    branches: [main]
    paths:
      - "README.md"
      - "readme-forge.config.json"
      - "package.json"
      - "pnpm-workspace.yaml"
      - ".github/workflows/readme-quality.yml"

jobs:
  readme-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npx github:danisantgry/readme-forge . --check --min-score ${minScore} --profile ${profile} --format json
`;
}
async function exists(filePath) {
    try {
        await access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export function createInitPlan(options) {
    const root = path.resolve(options.root);
    const planned = [
        {
            path: path.join(root, "readme-forge.config.json"),
            content: configContent(options)
        }
    ];
    if (options.githubActions) {
        planned.push({
            path: path.join(root, ".github", "workflows", "readme-quality.yml"),
            content: workflowContent(options)
        });
    }
    return planned;
}
export async function writeInitPlan(options) {
    const planned = createInitPlan(options);
    const skipped = [];
    const written = [];
    for (const entry of planned) {
        if (!options.force && (await exists(entry.path))) {
            skipped.push(entry.path);
        }
    }
    if (skipped.length) {
        throw new Error(`Refusing to overwrite existing files:\n${skipped.map((filePath) => `- ${filePath}`).join("\n")}\nRun again with --force to replace them.`);
    }
    for (const entry of planned) {
        await mkdir(path.dirname(entry.path), { recursive: true });
        await writeFile(entry.path, entry.content, "utf8");
        written.push(entry.path);
    }
    return { planned, skipped, written };
}
