#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeProject } from "./analyzer.js";
import { generateWithGemini } from "./gemini.js";
import { generateReadme } from "./generator.js";

type Args = {
  root: string;
  output: string;
  ai: boolean;
};

function parseArgs(argv: string[]): Args {
  const root = path.resolve(argv.find((arg) => !arg.startsWith("--")) ?? ".");
  const outputIndex = argv.indexOf("--output");
  return {
    root,
    output: path.resolve(outputIndex >= 0 ? argv[outputIndex + 1] : path.join(root, "README.md")),
    ai: argv.includes("--ai")
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const facts = await analyzeProject(args.root);
  const readme = args.ai ? await generateWithGemini(facts) : generateReadme(facts);
  await writeFile(args.output, `${readme.trim()}\n`, "utf8");
  console.log(`Wrote ${args.output}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
