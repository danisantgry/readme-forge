import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { analyzeProject } from "../src/analyzer.js";
import { parseConfig } from "../src/config.js";
import { generateReadme } from "../src/generator.js";
import { assessReadmeQuality, checkReadmeQuality } from "../src/quality.js";

const exec = promisify(execFile);
const fixturesRoot = path.join(process.cwd(), "test", "fixtures");

describe("readme-forge", () => {
  it("detects package metadata and generates a useful README", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-${Date.now()}-${Math.random()}`), { recursive: true });
    await mkdir(path.join(root, "node_modules"), { recursive: true });
    await mkdir(path.join(root, ".git"), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "demo-app",
      description: "A demo application.",
      scripts: { dev: "vite", test: "vitest run" },
      devDependencies: { vite: "latest", typescript: "latest" }
    }));
    await writeFile(path.join(root, "tsconfig.json"), "{}");

    const facts = await analyzeProject(root);
    const output = generateReadme(facts);
    expect(facts.frameworks).toContain("Vite");
    expect(facts.files).not.toContain("node_modules");
    expect(facts.files).not.toContain(".git");
    expect(output).toContain("# demo-app");
    expect(output).toContain("npm run dev");
  });

  it("supports explicit template presets and README quality checks", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-cli-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "demo-cli",
      description: "A demo CLI.",
      license: "MIT",
      scripts: { build: "tsc", test: "vitest run" }
    }));

    const facts = await analyzeProject(root);
    const output = generateReadme(facts, "cli");
    const report = assessReadmeQuality(output, facts);
    expect(output).toContain("command-line workflow");
    expect(report.percentage).toBe(100);
    expect(report.passedChecks).toContain("tests");
    expect(checkReadmeQuality(output, facts)).toHaveLength(0);
  });

  it("detects non-node project markers", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-rust-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "Cargo.toml"), "[package]\nname = \"demo\"\nversion = \"0.1.0\"\n");

    const facts = await analyzeProject(root);
    expect(facts.languages).toContain("Rust");
    expect(facts.frameworks).toContain("Rust crate");
  });

  it.each([
    {
      fixture: "typescript-cli",
      name: "fixture-ts-cli",
      language: "TypeScript",
      framework: undefined,
      description: "A fixture command-line tool."
    },
    {
      fixture: "vite-web",
      name: "fixture-vite-web",
      language: "TypeScript",
      framework: "Vite",
      description: "A fixture Vite web app."
    },
    {
      fixture: "python-package",
      name: "fixture-python-package",
      language: "Python",
      framework: "Python package",
      description: "A fixture Python package."
    },
    {
      fixture: "rust-crate",
      name: "fixture-rust-crate",
      language: "Rust",
      framework: "Rust crate",
      description: "A fixture Rust crate."
    },
    {
      fixture: "go-module",
      name: "fixture-go-module",
      language: "Go",
      framework: "Go module",
      description: "A useful software project."
    }
  ])("generates stable README output for $fixture fixture", async ({ fixture, name, language, framework, description }) => {
    const facts = await analyzeProject(path.join(fixturesRoot, fixture));
    const readme = generateReadme(facts);
    const quality = assessReadmeQuality(readme, facts);

    expect(facts.name).toBe(name);
    expect(facts.description).toBe(description);
    expect(facts.languages).toContain(language);
    if (framework) expect(facts.frameworks).toContain(framework);
    expect(readme).toContain(`# ${name}`);
    expect(readme).toContain(description);
    expect(readme).toContain("## Getting Started");
    expect(readme).toContain("## Testing");
    expect(quality.percentage).toBe(100);
  });

  it("supports JSON dry runs and diff review from the CLI", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-json-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "json-demo",
      description: "A JSON demo.",
      license: "MIT",
      scripts: { test: "node --test" }
    }));
    await writeFile(path.join(root, "README.md"), "# Old title\n");

    const jsonResult = await exec(process.execPath, ["node_modules/tsx/dist/cli.mjs", "src/cli.ts", root, "--dry-run", "--format", "json"]);
    const parsed = JSON.parse(jsonResult.stdout) as { readme: string; facts: { name: string } };
    expect(parsed.facts.name).toBe("json-demo");
    expect(parsed.readme).toContain("# json-demo");

    const diffResult = await exec(process.execPath, ["node_modules/tsx/dist/cli.mjs", "src/cli.ts", root, "--diff"]);
    expect(diffResult.stdout).toContain("--- README.md");
    expect(diffResult.stdout).toContain("+ # json-demo");
  });

  it("returns a scored README quality report from the CLI", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-check-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "check-demo",
      description: "A check demo.",
      license: "MIT",
      scripts: { test: "node --test" }
    }));
    await writeFile(path.join(root, "README.md"), "# check-demo\n\n## License\nMIT\n");

    const result = await exec(process.execPath, ["node_modules/tsx/dist/cli.mjs", "src/cli.ts", root, "--check", "--format", "json"])
      .catch((error: { stdout: string }) => error);
    const parsed = JSON.parse(result.stdout) as { ok: boolean; quality: { score: number; maxScore: number; percentage: number; issues: { id: string }[] } };

    expect(parsed.ok).toBe(false);
    expect(parsed.quality.score).toBeLessThan(parsed.quality.maxScore);
    expect(parsed.quality.percentage).toBeGreaterThan(0);
    expect(parsed.quality.issues.map((issue) => issue.id)).toContain("missing-tests");
  });

  it("supports minimum score gates for CI workflows", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-gate-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "gate-demo",
      description: "A gate demo.",
      license: "MIT",
      scripts: { test: "node --test" }
    }));
    await writeFile(path.join(root, "README.md"), "# gate-demo\n\n## License\nMIT\n");

    const passingResult = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      root,
      "--check",
      "--min-score",
      "40",
      "--format",
      "json"
    ]);
    const passing = JSON.parse(passingResult.stdout) as { ok: boolean; minimumScore: number; passedMinimumScore: boolean };
    expect(passing.ok).toBe(true);
    expect(passing.minimumScore).toBe(40);
    expect(passing.passedMinimumScore).toBe(true);

    const reorderedResult = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      "--check",
      "--min-score",
      "40",
      root,
      "--format",
      "json"
    ]);
    const reordered = JSON.parse(reorderedResult.stdout) as { ok: boolean; facts: { name: string } };
    expect(reordered.ok).toBe(true);
    expect(reordered.facts.name).toBe("gate-demo");

    const failingResult = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      root,
      "--check",
      "--min-score",
      "90",
      "--format",
      "json"
    ]).catch((error: { stdout: string }) => error);
    const failing = JSON.parse(failingResult.stdout) as { ok: boolean; minimumScore: number; passedMinimumScore: boolean };
    expect(failing.ok).toBe(false);
    expect(failing.minimumScore).toBe(90);
    expect(failing.passedMinimumScore).toBe(false);
  });

  it("parses and validates readme-forge config files", () => {
    const config = parseConfig(JSON.stringify({
      template: "cli",
      output: "README.generated.md",
      minScore: 85,
      format: "json",
      ai: false
    }));

    expect(config.template).toBe("cli");
    expect(config.output).toBe("README.generated.md");
    expect(config.minScore).toBe(85);
    expect(config.format).toBe("json");
  });

  it("uses config defaults while letting CLI flags override them", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-config-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "config-demo",
      description: "A config demo.",
      license: "MIT",
      scripts: { test: "node --test" }
    }));
    await writeFile(path.join(root, "readme-forge.config.json"), JSON.stringify({
      format: "json",
      minScore: 40,
      template: "library"
    }));
    await writeFile(path.join(root, "README.md"), "# config-demo\n\n## License\nMIT\n");

    const configuredResult = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      root,
      "--check"
    ]);
    const configured = JSON.parse(configuredResult.stdout) as { ok: boolean; minimumScore: number; quality: { percentage: number } };
    expect(configured.ok).toBe(true);
    expect(configured.minimumScore).toBe(40);
    expect(configured.quality.percentage).toBeGreaterThanOrEqual(40);

    const overrideResult = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      root,
      "--check",
      "--min-score",
      "90",
      "--format",
      "json"
    ]).catch((error: { stdout: string }) => error);
    const override = JSON.parse(overrideResult.stdout) as { ok: boolean; minimumScore: number };
    expect(override.ok).toBe(false);
    expect(override.minimumScore).toBe(90);
  });
});
