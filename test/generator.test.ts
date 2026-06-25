import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { analyzeProject } from "../src/analyzer.js";
import { createComparisonReport, formatComparisonMarkdown, renderComparisonHtml } from "../src/compare.js";
import { parseConfig } from "../src/config.js";
import { diffLines, formatUnifiedDiff, summarizeDiff } from "../src/diff.js";
import { createDoctorReport, formatDoctorReport } from "../src/doctor.js";
import { generateReadme } from "../src/generator.js";
import { createInitPlan } from "../src/init.js";
import { assessReadmeQuality, checkReadmeQuality } from "../src/quality.js";

const exec = promisify(execFile);
const fixturesRoot = path.join(process.cwd(), "test", "fixtures");

describe("readme-forge", () => {
  it("produces sequence-aware line diffs", () => {
    const diff = diffLines("# Demo\n\n## Install\nnpm install\n", "# Demo\n\nA useful project.\n\n## Install\nnpm install\n");
    const summary = summarizeDiff(diff);

    expect(summary.additions).toBe(2);
    expect(summary.removals).toBe(0);
    expect(summary.unchanged).toBe(4);
    expect(formatUnifiedDiff("# Demo\n## Install", "# Demo\nIntro\n## Install")).toContain("+ Intro");
  });

  it("detects package metadata and generates a useful README", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-${Date.now()}-${Math.random()}`), { recursive: true });
    await mkdir(path.join(root, "node_modules"), { recursive: true });
    await mkdir(path.join(root, ".git"), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "demo-app",
      description: "A demo application.",
      license: "MIT",
      repository: "git+https://github.com/example/demo-app.git",
      scripts: { dev: "vite", test: "vitest run" },
      devDependencies: { vite: "latest", typescript: "latest" }
    }));
    await writeFile(path.join(root, "tsconfig.json"), "{}");

    const facts = await analyzeProject(root);
    const output = generateReadme(facts);
    expect(facts.frameworks).toContain("Vite");
    expect(facts.repository?.owner).toBe("example");
    expect(facts.repository?.name).toBe("demo-app");
    expect(facts.files).not.toContain("node_modules");
    expect(facts.files).not.toContain(".git");
    expect(output).toContain("# demo-app");
    expect(output).toContain("img.shields.io/github/v/release/example/demo-app");
    expect(output).toContain("img.shields.io/npm/v/demo-app");
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

  it("detects package.json workspaces and summarizes workspace packages", async () => {
    const facts = await analyzeProject(path.join(fixturesRoot, "npm-workspace"));
    const readme = generateReadme(facts);

    expect(facts.packageManager).toBe("npm");
    expect(facts.workspaces?.manager).toBe("npm");
    expect(facts.workspaces?.patterns).toEqual(["packages/*", "apps/*"]);
    expect(facts.workspaces?.packages.map((workspacePackage) => workspacePackage.name)).toEqual(["@fixture/core", "@fixture/web"]);
    expect(readme).toContain("## Workspace Packages");
    expect(readme).toContain("`@fixture/core` at `packages/core`");
    expect(readme).toContain("`@fixture/web` at `apps/web`");
  });

  it("detects pnpm workspaces from pnpm-workspace.yaml", async () => {
    const facts = await analyzeProject(path.join(fixturesRoot, "pnpm-workspace"));
    const readme = generateReadme(facts);

    expect(facts.packageManager).toBe("pnpm");
    expect(facts.workspaces?.manager).toBe("pnpm");
    expect(facts.workspaces?.patterns).toEqual(["packages/*", "tools/*"]);
    expect(facts.workspaces?.packages.map((workspacePackage) => workspacePackage.name)).toEqual(["@fixture/ui", "@fixture/cli"]);
    expect(readme).toContain("Package manager: `pnpm`");
    expect(readme).toContain("Patterns: `packages/*`, `tools/*`");
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

  it("can disable generated badges from the CLI", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-no-badges-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "no-badge-demo",
      description: "A badge toggle demo.",
      license: "MIT",
      repository: { url: "https://github.com/example/no-badge-demo" }
    }));

    const result = await exec(process.execPath, ["node_modules/tsx/dist/cli.mjs", "src/cli.ts", root, "--dry-run", "--no-badges"]);

    expect(result.stdout).toContain("# no-badge-demo");
    expect(result.stdout).not.toContain("img.shields.io");
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

  it("supports quality profiles with different check depth", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-profile-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "profile-demo",
      description: "A profile demo.",
      license: "MIT",
      scripts: { test: "node --test" }
    }));
    await writeFile(path.join(root, "CONTRIBUTING.md"), "# Contributing\n");
    await writeFile(path.join(root, "SECURITY.md"), "# Security\n");
    await writeFile(path.join(root, "CHANGELOG.md"), "# Changelog\n");
    await writeFile(path.join(root, "README.md"), "# profile-demo\n\n## Getting Started\nnpm install\n\n## License\nMIT\n");

    const facts = await analyzeProject(root);
    const readme = await readFile(path.join(root, "README.md"), "utf8");
    const basic = assessReadmeQuality(readme, facts, "basic");
    const strict = assessReadmeQuality(readme, facts, "strict");

    expect(basic.percentage).toBe(100);
    expect(strict.issues.map((issue) => issue.id)).toContain("missing-changelog");
    expect(strict.maxScore).toBeGreaterThan(basic.maxScore);
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
      profile: "strict",
      badges: false,
      ai: false
    }));

    expect(config.template).toBe("cli");
    expect(config.output).toBe("README.generated.md");
    expect(config.minScore).toBe(85);
    expect(config.format).toBe("json");
    expect(config.profile).toBe("strict");
    expect(config.badges).toBe(false);
  });

  it("plans an adoption kit config and GitHub Actions workflow", () => {
    const root = path.join(os.tmpdir(), `readme-forge-init-plan-${Date.now()}-${Math.random()}`);
    const plan = createInitPlan({
      root,
      githubActions: true,
      minScore: 85,
      profile: "strict",
      template: "library",
      badges: false
    });

    expect(plan.map((entry) => path.basename(entry.path))).toEqual(["readme-forge.config.json", "readme-quality.yml"]);
    expect(plan[0].content).toContain('"template": "library"');
    expect(plan[0].content).toContain('"profile": "strict"');
    expect(plan[0].content).toContain('"badges": false');
    expect(plan[0].content).toContain('"minScore": 85');
    expect(plan[1].content).toContain("npx github:danisantgry/readme-forge . --check --min-score 85 --profile strict --format json");
  });

  it("previews the adoption kit without writing files", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-init-dry-${Date.now()}-${Math.random()}`), { recursive: true });

    const result = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      "init",
      "--path",
      root,
      "--github-actions",
      "--dry-run"
    ]);

    expect(result.stdout).toContain("readme-forge.config.json");
    expect(result.stdout).toContain("readme-quality.yml");
    await expect(readFile(path.join(root, "readme-forge.config.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(path.join(root, ".github", "workflows", "readme-quality.yml"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("writes an adoption kit and guards existing files", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-init-write-${Date.now()}-${Math.random()}`), { recursive: true });

    await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      "init",
      root,
      "--github-actions",
      "--min-score",
      "85",
      "--profile",
      "strict",
      "--template",
      "web",
      "--no-badges"
    ]);

    const config = parseConfig(await readFile(path.join(root, "readme-forge.config.json"), "utf8"));
    const workflow = await readFile(path.join(root, ".github", "workflows", "readme-quality.yml"), "utf8");

    expect(config.minScore).toBe(85);
    expect(config.profile).toBe("strict");
    expect(config.template).toBe("web");
    expect(config.badges).toBe(false);
    expect(workflow).toContain("--min-score 85 --profile strict");

    const blocked = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      "init",
      root
    ]).catch((error: { stderr: string }) => error);

    expect(blocked.stderr).toContain("Refusing to overwrite existing files");
    expect(blocked.stderr).toContain("readme-forge.config.json");
  });

  it("reports documentation health and adoption recommendations", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-doctor-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "doctor-demo",
      description: "A doctor demo.",
      license: "MIT",
      scripts: { test: "node --test" }
    }));
    await writeFile(path.join(root, "README.md"), "# doctor-demo\n");

    const report = await createDoctorReport({ root, minScore: 90, profile: "maintainer" });
    const text = formatDoctorReport(report);

    expect(report.ok).toBe(false);
    expect(report.readme.exists).toBe(true);
    expect(report.readme.passedMinimumScore).toBe(false);
    expect(report.recommendations.map((item) => item.id)).toContain("review-generated-diff");
    expect(report.recommendations.map((item) => item.id)).toContain("missing-install");
    expect(report.recommendations.map((item) => item.id)).toContain("add-config");
    expect(report.recommendations.map((item) => item.id)).toContain("add-readme-workflow");
    expect(text).toContain("# readme-forge doctor");
    expect(text).toContain("## Recommended Next Actions");
    expect(text).toContain("## Status");
    expect(text).toContain("needs attention");
  });

  it("emits JSON doctor reports from the CLI", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-doctor-json-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "doctor-json-demo",
      description: "A doctor JSON demo.",
      license: "MIT",
      scripts: { test: "node --test" }
    }));
    await writeFile(path.join(root, "README.md"), "# doctor-json-demo\n");

    const result = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      "doctor",
      root,
      "--min-score",
      "90",
      "--format",
      "json"
    ]).catch((error: { stdout: string }) => error);
    const parsed = JSON.parse(result.stdout) as {
      facts: { name: string };
      ok: boolean;
      readme: { passedMinimumScore: boolean };
      recommendations: { id: string }[];
    };

    expect(parsed.facts.name).toBe("doctor-json-demo");
    expect(parsed.ok).toBe(false);
    expect(parsed.readme.passedMinimumScore).toBe(false);
    expect(parsed.recommendations.map((item) => item.id)).toContain("minimum-score");
  });

  it("writes shareable markdown doctor reports from the CLI", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-doctor-report-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "doctor-report-demo",
      description: "A doctor report demo.",
      license: "MIT",
      scripts: { test: "node --test" }
    }));
    await writeFile(path.join(root, "README.md"), "# doctor-report-demo\n");

    const result = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      "doctor",
      root,
      "--report",
      "docs/readme-health.md"
    ]);
    const report = await readFile(path.join(root, "docs", "readme-health.md"), "utf8");

    expect(result.stdout).toContain("# readme-forge doctor");
    expect(report).toContain("# readme-forge doctor");
    expect(report).toContain("| Check | Value |");
    expect(report).toContain("## Recommended Next Actions");
    expect(report).toContain("readme-forge init . --dry-run");

    const jsonResult = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      "doctor",
      root,
      "--format",
      "json",
      "--report",
      "docs/readme-health-json.md"
    ]);
    const parsed = JSON.parse(jsonResult.stdout) as { facts: { name: string } };
    expect(parsed.facts.name).toBe("doctor-report-demo");
    await expect(readFile(path.join(root, "docs", "readme-health-json.md"), "utf8")).resolves.toContain("# readme-forge doctor");
  });

  it("renders safe, self-contained README comparison reports", async () => {
    const facts = await analyzeProject(path.join(fixturesRoot, "vite-web"));
    const generated = generateReadme(facts, "web", { badges: false });
    const summary = createComparisonReport({
      existing: "# Fixture\n",
      facts,
      generated,
      profile: "maintainer",
      readmePath: path.join(fixturesRoot, "vite-web", "README.md"),
      root: path.join(fixturesRoot, "vite-web")
    });
    const aiSummary = createComparisonReport({
      ai: true,
      existing: "# Fixture\n",
      facts,
      generated,
      profile: "maintainer",
      readmePath: path.join(fixturesRoot, "vite-web", "README.md"),
      root: path.join(fixturesRoot, "vite-web")
    });
    const markdown = formatComparisonMarkdown(summary);
    const aiMarkdown = formatComparisonMarkdown(aiSummary);
    const html = renderComparisonHtml({
      existing: "# Fixture <script>alert('no')</script>\n",
      facts,
      generated,
      profile: "maintainer",
      readmePath: path.join(fixturesRoot, "vite-web", "README.md"),
      root: path.join(fixturesRoot, "vite-web")
    });

    expect(html).toContain("readme-forge comparison");
    expect(html).toContain("Current score");
    expect(html).toContain("Generated score");
    expect(html).toContain("Focused line diff");
    expect(html).toContain("&lt;script&gt;alert(&#39;no&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert('no')</script>");
    expect(summary.generated.quality.percentage).toBeGreaterThanOrEqual(summary.current.quality.percentage);
    expect(markdown).toContain("# README Comparison");
    expect(markdown).toContain("| Current |");
    expect(markdown).toContain("readme-forge compare . --output reports/readme.html");
    expect(markdown).toContain("No project data was uploaded");
    expect(aiMarkdown).toContain("optional AI refinement");
  });

  it("writes HTML comparison reports from the CLI", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-compare-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "compare-demo",
      description: "A comparison report demo.",
      license: "MIT",
      scripts: { dev: "node index.js", test: "node --test" }
    }));
    await writeFile(path.join(root, "README.md"), "# compare-demo\n");

    const result = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      "compare",
      root,
      "--output",
      "reports/readme.html"
    ]);
    const report = await readFile(path.join(root, "reports", "readme.html"), "utf8");

    expect(result.stdout).toContain("reports");
    expect(report).toContain("compare-demo README comparison");
    expect(report).toContain("percentage points");
    expect(report).toContain("No project data was uploaded");
  });

  it("emits Markdown and JSON comparison summaries from the CLI", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-compare-format-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "compare-format-demo",
      description: "A comparison format demo.",
      license: "MIT",
      scripts: { test: "node --test" }
    }));
    await writeFile(path.join(root, "README.md"), "# compare-format-demo\n");

    const markdownResult = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      "compare",
      root,
      "--format",
      "markdown"
    ]);
    expect(markdownResult.stdout).toContain("# README Comparison");
    expect(markdownResult.stdout).toContain("## Quality Checks");
    expect(markdownResult.stdout).toContain("readme-forge . --diff");

    const jsonResult = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      "compare",
      root,
      "--format",
      "json"
    ]);
    const parsed = JSON.parse(jsonResult.stdout) as {
      changed: boolean;
      current: { quality: { percentage: number } };
      generated: { quality: { percentage: number } };
      project: { name: string };
    };

    expect(parsed.project.name).toBe("compare-format-demo");
    expect(parsed.changed).toBe(true);
    expect(parsed.generated.quality.percentage).toBeGreaterThanOrEqual(parsed.current.quality.percentage);

    const outputResult = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      "compare",
      root,
      "--format",
      "markdown",
      "--output",
      "reports/readme-summary.md"
    ]);
    const savedSummary = await readFile(path.join(root, "reports", "readme-summary.md"), "utf8");

    expect(outputResult.stderr).toContain("Wrote");
    expect(savedSummary).toContain("# README Comparison");
  });

  it("creates a local README review bundle from the CLI", async () => {
    const root = await mkdir(path.join(os.tmpdir(), `readme-forge-review-${Date.now()}-${Math.random()}`), { recursive: true });
    await writeFile(path.join(root, "package.json"), JSON.stringify({
      name: "review-demo",
      description: "A review bundle demo.",
      license: "MIT",
      scripts: { build: "tsc", test: "node --test" }
    }));
    await writeFile(path.join(root, "README.md"), "# review-demo\n");

    const result = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      "review",
      root,
      "--output",
      "readme-forge-review",
      "--min-score",
      "90"
    ]);
    const reviewDir = path.join(root, "readme-forge-review");
    const index = await readFile(path.join(reviewDir, "README.md"), "utf8");
    const generated = await readFile(path.join(reviewDir, "README.generated.md"), "utf8");
    const prComment = await readFile(path.join(reviewDir, "PR_COMMENT.md"), "utf8");
    const summary = JSON.parse(await readFile(path.join(reviewDir, "summary.json"), "utf8")) as {
      project: { name: string; readmePath: string };
      readme: { generatedScore: number; generatedWithAi: boolean; improvement: number };
      files: Record<string, string>;
    };
    const facts = await analyzeProject(root);
    const originalReadme = await readFile(path.join(root, "README.md"), "utf8");

    expect(result.stdout).toContain("Created README review bundle");
    expect(index).toContain("# readme-forge Review Bundle");
    expect(generated).toContain("# review-demo");
    expect(prComment).toContain("## README Review");
    expect(summary.project.name).toBe("review-demo");
    expect(summary.project.readmePath).toBe("README.md");
    expect(summary.readme.generatedScore).toBeGreaterThan(summary.readme.improvement);
    expect(summary.readme.generatedWithAi).toBe(false);
    expect(summary.files.generatedReadme).toBe("readme-forge-review/README.generated.md");
    expect(originalReadme).toBe("# review-demo\n");
    expect(facts.files).not.toContain("readme-forge-review");
  });

  it("adds ecosystem-aware doctor recommendations for web apps and Python packages", async () => {
    const webReport = await createDoctorReport({ root: path.join(fixturesRoot, "vite-web") });
    const webRecommendations = new Map(webReport.recommendations.map((item) => [item.id, item]));

    expect(webRecommendations.get("document-install-command")?.command).toBe("npm install");
    expect(webRecommendations.get("document-dev-command")?.command).toBe("npm run dev");
    expect(webRecommendations.get("document-build-command")?.command).toBe("npm run build");
    expect(webRecommendations.get("document-test-command")?.command).toBe("npm run test");
    expect(webRecommendations.get("add-web-local-development-example")?.command).toBe("readme-forge . --template web --dry-run");

    const pythonReport = await createDoctorReport({ root: path.join(fixturesRoot, "python-package") });
    const pythonRecommendations = new Map(pythonReport.recommendations.map((item) => [item.id, item]));

    expect(pythonRecommendations.get("document-python-install-command")?.command).toBe("python -m pip install -e .");
    expect(pythonRecommendations.get("document-python-test-command")?.command).toBe("python -m pytest");
    expect(pythonRecommendations.get("add-library-usage-example")?.command).toBe("readme-forge . --template library --dry-run");
  });

  it("adds workspace-aware doctor recommendations", async () => {
    const report = await createDoctorReport({ root: path.join(fixturesRoot, "npm-workspace") });
    const recommendations = new Map(report.recommendations.map((item) => [item.id, item]));

    expect(recommendations.get("document-install-command")?.command).toBe("npm install");
    expect(recommendations.get("document-build-command")?.command).toBe("npm run build");
    expect(recommendations.get("document-test-command")?.command).toBe("npm run test");
    expect(recommendations.get("document-workspace-summary")?.message).toContain("2 detected workspace packages");
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
      profile: "standard",
      template: "library"
    }));
    await writeFile(path.join(root, "README.md"), "# config-demo\n\n## License\nMIT\n");

    const configuredResult = await exec(process.execPath, [
      "node_modules/tsx/dist/cli.mjs",
      "src/cli.ts",
      root,
      "--check"
    ]);
    const configured = JSON.parse(configuredResult.stdout) as { ok: boolean; minimumScore: number; quality: { percentage: number; profile: string } };
    expect(configured.ok).toBe(true);
    expect(configured.minimumScore).toBe(40);
    expect(configured.quality.profile).toBe("standard");
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
