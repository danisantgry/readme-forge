import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { analyzeProject } from "../src/analyzer.js";
import { generateReadme } from "../src/generator.js";
import { checkReadmeQuality } from "../src/quality.js";

const exec = promisify(execFile);

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
    expect(output).toContain("command-line workflow");
    expect(checkReadmeQuality(output, facts)).toHaveLength(0);
  });

  it("detects non-node project markers", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-rust-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "Cargo.toml"), "[package]\nname = \"demo\"\nversion = \"0.1.0\"\n");

    const facts = await analyzeProject(root);
    expect(facts.languages).toContain("Rust");
    expect(facts.frameworks).toContain("Rust crate");
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
});
