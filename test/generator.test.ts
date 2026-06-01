import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeProject } from "../src/analyzer.js";
import { generateReadme } from "../src/generator.js";
import { checkReadmeQuality } from "../src/quality.js";

describe("readme-forge", () => {
  it("detects package metadata and generates a useful README", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-${Date.now()}-${Math.random()}`), { recursive: true });
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
});
