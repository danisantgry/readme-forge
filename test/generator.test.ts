import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeProject } from "../src/analyzer.js";
import { generateReadme } from "../src/generator.js";

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
});
