#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeProject } from "./analyzer.js";
import { loadConfig } from "./config.js";
import { generateWithGemini } from "./gemini.js";
import { generateReadme } from "./generator.js";
import { assessReadmeQuality } from "./quality.js";
const optionNames = new Set(["--config", "--format", "--min-score", "--output", "--template"]);
function getOption(argv, name) {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : undefined;
}
function hasOption(argv, name) {
    return argv.includes(name);
}
function resolveRoot(argv) {
    const optionValueIndexes = new Set(argv
        .map((arg, index) => (optionNames.has(arg) ? index + 1 : -1))
        .filter((index) => index >= 0));
    return path.resolve(argv.find((arg, index) => !arg.startsWith("--") && !optionValueIndexes.has(index)) ?? ".");
}
async function parseArgs(argv) {
    const root = resolveRoot(argv);
    const config = await loadConfig(root, getOption(argv, "--config"));
    const template = getOption(argv, "--template") ?? config.template ?? "auto";
    const format = getOption(argv, "--format") ?? config.format ?? "markdown";
    const minScoreOption = getOption(argv, "--min-score");
    const minScore = minScoreOption !== undefined ? Number(minScoreOption) : config.minScore;
    if (!["auto", "cli", "library", "web"].includes(template)) {
        throw new Error("--template must be one of: auto, cli, library, web");
    }
    if (!["markdown", "json"].includes(format)) {
        throw new Error("--format must be one of: markdown, json");
    }
    if (minScore !== undefined && (!Number.isInteger(minScore) || minScore < 0 || minScore > 100)) {
        throw new Error("--min-score must be an integer between 0 and 100");
    }
    if (minScoreOption !== undefined && !hasOption(argv, "--check")) {
        throw new Error("--min-score can only be used with --check");
    }
    return {
        root,
        output: path.resolve(getOption(argv, "--output") ?? (config.output ? path.resolve(root, config.output) : path.join(root, "README.md"))),
        ai: hasOption(argv, "--ai") || config.ai === true,
        check: hasOption(argv, "--check"),
        diff: hasOption(argv, "--diff"),
        dryRun: hasOption(argv, "--dry-run"),
        format: format,
        minScore,
        template: template
    };
}
function createLineDiff(existing, generated) {
    const oldLines = existing.trimEnd().split(/\r?\n/);
    const newLines = generated.trimEnd().split(/\r?\n/);
    const max = Math.max(oldLines.length, newLines.length);
    const output = ["--- README.md", "+++ generated README.md"];
    for (let index = 0; index < max; index += 1) {
        const oldLine = oldLines[index];
        const newLine = newLines[index];
        if (oldLine === newLine)
            continue;
        if (oldLine !== undefined)
            output.push(`- ${oldLine}`);
        if (newLine !== undefined)
            output.push(`+ ${newLine}`);
    }
    return output.length === 2 ? "README is already in sync with generated output." : output.join("\n");
}
async function main() {
    const args = await parseArgs(process.argv.slice(2));
    const facts = await analyzeProject(args.root);
    const readme = args.ai ? await generateWithGemini(facts) : generateReadme(facts, args.template);
    const existing = await readFile(args.output, "utf8").catch(() => "");
    if (args.check) {
        const report = assessReadmeQuality(existing || readme, facts);
        const passedMinimumScore = args.minScore === undefined || report.percentage >= args.minScore;
        const ok = args.minScore === undefined ? report.issues.length === 0 : passedMinimumScore;
        if (args.format === "json") {
            console.log(JSON.stringify({ ok, minimumScore: args.minScore, passedMinimumScore, quality: report, facts }, null, 2));
            process.exitCode = ok ? 0 : 1;
            return;
        }
        console.log(`README quality score: ${report.score}/${report.maxScore} (${report.percentage}%)`);
        if (args.minScore !== undefined) {
            console.log(`Minimum score: ${args.minScore}%`);
        }
        if (ok) {
            console.log("README quality check passed.");
            return;
        }
        for (const issue of report.issues) {
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
