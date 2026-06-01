import type { ProjectFacts } from "./analyzer.js";

export type TemplatePreset = "auto" | "cli" | "library" | "web";

function commandFor(manager: ProjectFacts["packageManager"], command: string): string {
  if (manager === "pnpm") return `pnpm ${command}`;
  if (manager === "yarn") return command === "install" ? "yarn" : `yarn ${command}`;
  return command === "install" ? "npm install" : `npm run ${command}`;
}

function inferPreset(facts: ProjectFacts, requested: TemplatePreset): Exclude<TemplatePreset, "auto"> {
  if (requested !== "auto") return requested;
  if (facts.frameworks.some((name) => ["Vite", "Next.js", "React"].includes(name))) return "web";
  if (facts.scripts.start || facts.scripts.dev || facts.files.includes("src/cli.ts")) return "cli";
  return "library";
}

function presetLine(preset: Exclude<TemplatePreset, "auto">): string {
  if (preset === "cli") return "Provides a command-line workflow for repeatable local automation.";
  if (preset === "web") return "Includes a web application workflow with clear local development commands.";
  return "Documents installation, usage, testing, and project structure for library consumers.";
}

export function generateReadme(facts: ProjectFacts, preset: TemplatePreset = "auto"): string {
  const scripts = Object.keys(facts.scripts);
  const selectedPreset = inferPreset(facts, preset);
  const install = facts.packageManager === "unknown" ? "# install dependencies for your stack" : commandFor(facts.packageManager, "install");
  const run = scripts.includes("dev") ? commandFor(facts.packageManager, "dev") : scripts[0] ? commandFor(facts.packageManager, scripts[0]) : "# add a run command";
  const test = scripts.includes("test") ? commandFor(facts.packageManager, "test") : "# add tests";

  return `# ${facts.name}

${facts.description}

## Highlights

- Built with ${facts.languages.length ? facts.languages.join(", ") : "a lightweight project structure"}.
- ${facts.frameworks.length ? `Uses ${facts.frameworks.join(", ")}.` : "Keeps dependencies focused and easy to inspect."}
- Includes clear setup, run, and test instructions.
- ${presetLine(selectedPreset)}

## Getting Started

\`\`\`bash
${install}
${run}
\`\`\`

## Scripts

${scripts.length ? scripts.map((script) => `- \`${script}\`: \`${facts.scripts[script]}\``).join("\n") : "- Add project scripts to document common workflows."}

## Testing

\`\`\`bash
${test}
\`\`\`

## Project Structure

\`\`\`text
${facts.files.slice(0, 18).map((file) => `./${file}`).join("\n")}
\`\`\`

## License

${facts.license || "Add a license before publishing."}
`;
}
