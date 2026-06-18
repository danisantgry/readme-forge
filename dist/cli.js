#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeProject } from "./analyzer.js";
import { loadConfig } from "./config.js";
import { createDoctorReport, formatDoctorReport } from "./doctor.js";
import { generateWithGemini } from "./gemini.js";
import { generateReadme } from "./generator.js";
import { createInitPlan, writeInitPlan } from "./init.js";
import { assessReadmeQuality } from "./quality.js";
const optionNames = new Set(["--config", "--format", "--min-score", "--output", "--profile", "--report", "--template"]);
const initOptionNames = new Set(["--min-score", "--path", "--profile", "--template"]);
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
function resolveInitRoot(argv) {
    const explicitPath = getOption(argv, "--path");
    if (explicitPath)
        return path.resolve(explicitPath);
    const optionValueIndexes = new Set(argv
        .map((arg, index) => (initOptionNames.has(arg) ? index + 1 : -1))
        .filter((index) => index >= 0));
    return path.resolve(argv.find((arg, index) => !arg.startsWith("--") && !optionValueIndexes.has(index)) ?? ".");
}
async function parseArgs(argv) {
    const root = resolveRoot(argv);
    const config = await loadConfig(root, getOption(argv, "--config"));
    const template = getOption(argv, "--template") ?? config.template ?? "auto";
    const format = getOption(argv, "--format") ?? config.format ?? "markdown";
    const profile = getOption(argv, "--profile") ?? config.profile ?? "maintainer";
    const minScoreOption = getOption(argv, "--min-score");
    const minScore = minScoreOption !== undefined ? Number(minScoreOption) : config.minScore;
    if (!["auto", "cli", "library", "web"].includes(template)) {
        throw new Error("--template must be one of: auto, cli, library, web");
    }
    if (!["markdown", "json"].includes(format)) {
        throw new Error("--format must be one of: markdown, json");
    }
    if (!["basic", "standard", "maintainer", "strict"].includes(profile)) {
        throw new Error("--profile must be one of: basic, standard, maintainer, strict");
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
        badges: hasOption(argv, "--badges") || (!hasOption(argv, "--no-badges") && config.badges !== false),
        check: hasOption(argv, "--check"),
        diff: hasOption(argv, "--diff"),
        dryRun: hasOption(argv, "--dry-run"),
        format: format,
        minScore,
        profile: profile,
        template: template
    };
}
async function runDoctor(argv) {
    const root = resolveRoot(argv);
    const config = await loadConfig(root, getOption(argv, "--config"));
    const template = getOption(argv, "--template") ?? config.template ?? "auto";
    const format = getOption(argv, "--format") ?? config.format ?? "markdown";
    const profile = getOption(argv, "--profile") ?? config.profile ?? "maintainer";
    const minScoreOption = getOption(argv, "--min-score");
    const minScore = minScoreOption !== undefined ? Number(minScoreOption) : config.minScore;
    const output = getOption(argv, "--output") ?? config.output;
    const reportPath = getOption(argv, "--report");
    if (!["auto", "cli", "library", "web"].includes(template)) {
        throw new Error("--template must be one of: auto, cli, library, web");
    }
    if (!["markdown", "json"].includes(format)) {
        throw new Error("--format must be one of: markdown, json");
    }
    if (!["basic", "standard", "maintainer", "strict"].includes(profile)) {
        throw new Error("--profile must be one of: basic, standard, maintainer, strict");
    }
    if (minScore !== undefined && (!Number.isInteger(minScore) || minScore < 0 || minScore > 100)) {
        throw new Error("--min-score must be an integer between 0 and 100");
    }
    const report = await createDoctorReport({
        root,
        output: output ? path.resolve(root, output) : undefined,
        badges: hasOption(argv, "--badges") || (!hasOption(argv, "--no-badges") && config.badges !== false),
        minScore,
        profile: profile,
        template: template
    });
    const markdownReport = formatDoctorReport(report);
    if (reportPath) {
        const resolvedReportPath = path.resolve(root, reportPath);
        await mkdir(path.dirname(resolvedReportPath), { recursive: true });
        await writeFile(resolvedReportPath, `${markdownReport.trim()}\n`, "utf8");
        console.error(`Wrote ${resolvedReportPath}`);
    }
    if (format === "json") {
        console.log(JSON.stringify(report, null, 2));
    }
    else {
        console.log(markdownReport);
    }
    if (report.readme.minimumScore !== undefined && !report.readme.passedMinimumScore) {
        process.exitCode = 1;
    }
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
    const argv = process.argv.slice(2);
    if (argv[0] === "doctor") {
        await runDoctor(argv.slice(1));
        return;
    }
    if (argv[0] === "init") {
        const initArgs = argv.slice(1);
        const template = getOption(initArgs, "--template") ?? "auto";
        const profile = getOption(initArgs, "--profile") ?? "maintainer";
        const minScoreOption = getOption(initArgs, "--min-score");
        const minScore = minScoreOption === undefined ? 90 : Number(minScoreOption);
        if (!["auto", "cli", "library", "web"].includes(template)) {
            throw new Error("--template must be one of: auto, cli, library, web");
        }
        if (!["basic", "standard", "maintainer", "strict"].includes(profile)) {
            throw new Error("--profile must be one of: basic, standard, maintainer, strict");
        }
        if (!Number.isInteger(minScore) || minScore < 0 || minScore > 100) {
            throw new Error("--min-score must be an integer between 0 and 100");
        }
        const options = {
            root: resolveInitRoot(initArgs),
            badges: !hasOption(initArgs, "--no-badges"),
            force: hasOption(initArgs, "--force"),
            githubActions: hasOption(initArgs, "--github-actions") || hasOption(initArgs, "--with-github-actions"),
            minScore,
            profile: profile,
            template: template
        };
        if (hasOption(initArgs, "--dry-run")) {
            console.log(`Planned readme-forge adoption kit for ${options.root}:`);
            for (const entry of createInitPlan(options)) {
                console.log(`- ${entry.path}`);
            }
            return;
        }
        const result = await writeInitPlan(options);
        console.log("Created readme-forge adoption kit:");
        for (const filePath of result.written) {
            console.log(`- ${filePath}`);
        }
        return;
    }
    const args = await parseArgs(argv);
    const facts = await analyzeProject(args.root);
    const readme = args.ai ? await generateWithGemini(facts) : generateReadme(facts, args.template, { badges: args.badges });
    const existing = await readFile(args.output, "utf8").catch(() => "");
    if (args.check) {
        const report = assessReadmeQuality(existing || readme, facts, args.profile);
        const passedMinimumScore = args.minScore === undefined || report.percentage >= args.minScore;
        const ok = args.minScore === undefined ? report.issues.length === 0 : passedMinimumScore;
        if (args.format === "json") {
            console.log(JSON.stringify({ ok, minimumScore: args.minScore, passedMinimumScore, quality: report, facts }, null, 2));
            process.exitCode = ok ? 0 : 1;
            return;
        }
        console.log(`README quality score: ${report.score}/${report.maxScore} (${report.percentage}%)`);
        console.log(`Profile: ${report.profile}`);
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
