#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeProject } from "./analyzer.js";
import { generateWithGemini } from "./gemini.js";
import { generateReadme, type TemplatePreset } from "./generator.js";
import { checkReadmeQuality } from "./quality.js";

type OutputFormat = "markdown" | "json";

type Args = {
  root: string;
  output: string;
  ai: boolean;
  check: boolean;
  diff: boolean;
  dryRun: boolean;
  format: OutputFormat;
  template: TemplatePreset;
};

function parseArgs(argv: string[]): Args {
  const root = path.resolve(argv.find((arg) => !arg.startsWith("--")) ?? ".");
  const outputIndex = argv.indexOf("--output");
  const templateIndex = argv.indexOf("--template");
  const formatIndex = argv.indexOf("--format");
  const template = templateIndex >= 0 ? argv[templateIndex + 1] : "auto";
  const format = formatIndex >= 0 ? argv[formatIndex + 1] : "markdown";
  if (!["auto", "cli", "library", "web"].includes(template)) {
    throw new Error("--template must be one of: auto, cli, library, web");
  }
  if (!["markdown", "json"].includes(format)) {
    throw new Error("--format must be one of: markdown, json");
  }

  return {
    root,
    output: path.resolve(outputIndex >= 0 ? argv[outputIndex + 1] : path.join(root, "README.md")),
    ai: argv.includes("--ai"),
    check: argv.includes("--check"),
    diff: argv.includes("--diff"),
    dryRun: argv.includes("--dry-run"),
    format: format as OutputFormat,
    template: template as TemplatePreset
  };
}

function createLineDiff(existing: string, generated: string): string {
  const oldLines = existing.trimEnd().split(/\r?\n/);
  const newLines = generated.trimEnd().split(/\r?\n/);
  const max = Math.max(oldLines.length, newLines.length);
  const output = ["--- README.md", "+++ generated README.md"];

  for (let index = 0; index < max; index += 1) {
    const oldLine = oldLines[index];
    const newLine = newLines[index];
    if (oldLine === newLine) continue;
    if (oldLine !== undefined) output.push(`- ${oldLine}`);
    if (newLine !== undefined) output.push(`+ ${newLine}`);
  }

  return output.length === 2 ? "README is already in sync with generated output." : output.join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const facts = await analyzeProject(args.root);
  const readme = args.ai ? await generateWithGemini(facts) : generateReadme(facts, args.template);
  const existing = await readFile(args.output, "utf8").catch(() => "");

  if (args.check) {
    const issues = checkReadmeQuality(existing || readme, facts);
    if (args.format === "json") {
      console.log(JSON.stringify({ ok: issues.length === 0, issues, facts }, null, 2));
      process.exitCode = issues.length ? 1 : 0;
      return;
    }

    if (!issues.length) {
      console.log("README quality check passed.");
      return;
    }

    for (const issue of issues) {
      console.log(`${issue.id}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  if (args.diff) {
    if (args.format === "json") {
      console.log(JSON.stringify({ output: args.output, changed: existing.trimEnd() !== readme.trimEnd(), readme, facts }, null, 2));
      return;
    }
    console.log(createLineDiff(existing, readme));
    return;
  }

  if (args.dryRun) {
    if (args.format === "json") {
      console.log(JSON.stringify({ readme, facts }, null, 2));
      return;
    }
    console.log(readme.trim());
    return;
  }

  await writeFile(args.output, `${readme.trim()}\n`, "utf8");
  console.log(`Wrote ${args.output}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
