function commandFor(manager, command) {
    if (manager === "pnpm")
        return `pnpm ${command}`;
    if (manager === "yarn")
        return command === "install" ? "yarn" : `yarn ${command}`;
    return command === "install" ? "npm install" : `npm run ${command}`;
}
function inferPreset(facts, requested) {
    if (requested !== "auto")
        return requested;
    if (facts.frameworks.some((name) => ["Vite", "Next.js", "React"].includes(name)))
        return "web";
    if (facts.scripts.start || facts.scripts.dev || facts.files.includes("src/cli.ts"))
        return "cli";
    return "library";
}
function presetLine(preset) {
    if (preset === "cli")
        return "Provides a command-line workflow for repeatable local automation.";
    if (preset === "web")
        return "Includes a web application workflow with clear local development commands.";
    return "Documents installation, usage, testing, and project structure for library consumers.";
}
function badgeSection(facts, enabled) {
    if (!enabled)
        return "";
    const badges = [];
    const githubSlug = facts.repository?.owner && facts.repository.name ? `${facts.repository.owner}/${facts.repository.name}` : undefined;
    if (githubSlug) {
        badges.push(`[![Release](https://img.shields.io/github/v/release/${githubSlug}?label=release)](https://github.com/${githubSlug}/releases)`);
        badges.push(`[![Issues](https://img.shields.io/github/issues/${githubSlug})](https://github.com/${githubSlug}/issues)`);
    }
    if (facts.license) {
        badges.push(`![License](https://img.shields.io/badge/license-${encodeURIComponent(facts.license)}-green)`);
    }
    if (facts.packageName && !facts.privatePackage && facts.packageManager !== "unknown") {
        const packageName = encodeURIComponent(facts.packageName);
        badges.push(`[![npm](https://img.shields.io/npm/v/${packageName}?label=npm)](https://www.npmjs.com/package/${packageName})`);
    }
    return badges.length ? `${badges.join("\n")}\n\n` : "";
}
function workspaceSection(facts) {
    if (!facts.workspaces)
        return "";
    const packages = facts.workspaces.packages.length
        ? facts.workspaces.packages
            .map((workspacePackage) => `- \`${workspacePackage.name}\` at \`${workspacePackage.path}\`${workspacePackage.description ? `: ${workspacePackage.description}` : ""}`)
            .join("\n")
        : "- No package manifests were found for the configured workspace patterns.";
    return `\n## Workspace Packages\n\nPackage manager: \`${facts.workspaces.manager}\`\n\nPatterns: ${facts.workspaces.patterns.map((pattern) => `\`${pattern}\``).join(", ")}\n\n${packages}\n`;
}
export function generateReadme(facts, preset = "auto", options = {}) {
    const scripts = Object.keys(facts.scripts);
    const selectedPreset = inferPreset(facts, preset);
    const install = facts.packageManager === "unknown" ? "# install dependencies for your stack" : commandFor(facts.packageManager, "install");
    const run = scripts.includes("dev") ? commandFor(facts.packageManager, "dev") : scripts[0] ? commandFor(facts.packageManager, scripts[0]) : "# add a run command";
    const test = scripts.includes("test") ? commandFor(facts.packageManager, "test") : "# add tests";
    return `# ${facts.name}

${badgeSection(facts, options.badges !== false)}${facts.description}

## Highlights

- Built with ${facts.languages.length ? facts.languages.join(", ") : "a lightweight project structure"}.
- ${facts.frameworks.length ? `Uses ${facts.frameworks.join(", ")}.` : "Keeps dependencies focused and easy to inspect."}
- ${facts.workspaces ? `Includes ${facts.workspaces.packages.length} workspace package${facts.workspaces.packages.length === 1 ? "" : "s"}.` : "Keeps the repository layout straightforward to scan."}
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
${workspaceSection(facts)}

## Project Structure

\`\`\`text
${facts.files.slice(0, 18).map((file) => `./${file}`).join("\n")}
\`\`\`

## License

${facts.license || "Add a license before publishing."}
`;
}
