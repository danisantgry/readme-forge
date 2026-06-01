#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeProject } from "./analyzer.js";
import { generateWithGemini } from "./gemini.js";
import { generateReadme } from "./generator.js";
import { checkReadmeQuality } from "./quality.js";
function parseArgs(argv) {
    const root = path.resolve(argv.find((arg) => !arg.startsWith("--")) ?? ".");
    const outputIndex = argv.indexOf("--output");
    const templateIndex = argv.indexOf("--template");
    const template = templateIndex >= 0 ? argv[templateIndex + 1] : "auto";
    if (!["auto", "cli", "library", "web"].includes(template)) {
        throw new Error("--template must be one of: auto, cli, library, web");
    }
    return {
        root,
        output: path.resolve(outputIndex >= 0 ? argv[outputIndex + 1] : path.join(root, "README.md")),
        ai: argv.includes("--ai"),
        check: argv.includes("--check"),
        dryRun: argv.includes("--dry-run"),
        template: template
    };
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    const facts = await analyzeProject(args.root);
    const readme = args.ai ? await generateWithGemini(facts) : generateReadme(facts, args.template);
    if (args.check) {
        const existing = await readFile(args.output, "utf8").catch(() => "");
        const issues = checkReadmeQuality(existing || readme, facts);
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
    if (args.dryRun) {
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
