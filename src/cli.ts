#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeProject } from "./analyzer.js";
import { createComparisonReport, formatComparisonMarkdown, renderComparisonHtml } from "./compare.js";
import { loadConfig, type OutputFormat } from "./config.js";
import { formatUnifiedDiff } from "./diff.js";
import { createDoctorReport, formatDoctorReport } from "./doctor.js";
import { generateWithGemini } from "./gemini.js";
import { generateReadme, type TemplatePreset } from "./generator.js";
import { createInitPlan, writeInitPlan } from "./init.js";
import { assessReadmeQuality, type QualityProfile } from "./quality.js";

type Args = {
  root: string;
  output: string;
  ai: boolean;
  badges: boolean;
  check: boolean;
  diff: boolean;
  dryRun: boolean;
  format: OutputFormat;
  minScore?: number;
  profile: QualityProfile;
  template: TemplatePreset;
};

type CompareFormat = "html" | "markdown" | "json";

const optionNames = new Set(["--config", "--format", "--min-score", "--output", "--profile", "--readme", "--report", "--template"]);
const initOptionNames = new Set(["--min-score", "--path", "--profile", "--template"]);

function getOption(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function hasOption(argv: string[], name: string): boolean {
  return argv.includes(name);
}

function resolveRoot(argv: string[]): string {
  const optionValueIndexes = new Set(
    argv
      .map((arg, index) => (optionNames.has(arg) ? index + 1 : -1))
      .filter((index) => index >= 0)
  );

  return path.resolve(argv.find((arg, index) => !arg.startsWith("--") && !optionValueIndexes.has(index)) ?? ".");
}

function resolveInitRoot(argv: string[]): string {
  const explicitPath = getOption(argv, "--path");
  if (explicitPath) return path.resolve(explicitPath);

  const optionValueIndexes = new Set(
    argv
      .map((arg, index) => (initOptionNames.has(arg) ? index + 1 : -1))
      .filter((index) => index >= 0)
  );

  return path.resolve(argv.find((arg, index) => !arg.startsWith("--") && !optionValueIndexes.has(index)) ?? ".");
}

async function parseArgs(argv: string[]): Promise<Args> {
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
    format: format as OutputFormat,
    minScore,
    profile: profile as QualityProfile,
    template: template as TemplatePreset
  };
}

async function runDoctor(argv: string[]): Promise<void> {
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
    profile: profile as QualityProfile,
    template: template as TemplatePreset
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
  } else {
    console.log(markdownReport);
  }

  if (report.readme.minimumScore !== undefined && !report.readme.passedMinimumScore) {
    process.exitCode = 1;
  }
}

async function runCompare(argv: string[]): Promise<void> {
  const root = resolveRoot(argv);
  const config = await loadConfig(root, getOption(argv, "--config"));
  const template = getOption(argv, "--template") ?? config.template ?? "auto";
  const profile = getOption(argv, "--profile") ?? config.profile ?? "maintainer";
  const format = getOption(argv, "--format") ?? "html";
  if (!["auto", "cli", "library", "web"].includes(template)) {
    throw new Error("--template must be one of: auto, cli, library, web");
  }
  if (!["basic", "standard", "maintainer", "strict"].includes(profile)) {
    throw new Error("--profile must be one of: basic, standard, maintainer, strict");
  }
  if (!["html", "markdown", "json"].includes(format)) {
    throw new Error("compare --format must be one of: html, markdown, json");
  }

  const facts = await analyzeProject(root);
  const generated = hasOption(argv, "--ai")
    ? await generateWithGemini(facts)
    : generateReadme(facts, template as TemplatePreset, {
      badges: hasOption(argv, "--badges") || (!hasOption(argv, "--no-badges") && config.badges !== false)
    });
  const readmePath = path.resolve(root, getOption(argv, "--readme") ?? config.output ?? "README.md");
  const existing = await readFile(readmePath, "utf8").catch(() => "");
  const reportOptions = {
    existing,
    facts,
    generated,
    profile: profile as QualityProfile,
    readmePath,
    root
  };
  const output = getOption(argv, "--output");
  const compareFormat = format as CompareFormat;

  if (compareFormat === "json") {
    const json = JSON.stringify(createComparisonReport(reportOptions), null, 2);
    if (!output) {
      console.log(json);
      return;
    }

    const outputPath = path.resolve(root, output);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${json}\n`, "utf8");
    console.error(`Wrote ${outputPath}`);
    return;
  }

  if (compareFormat === "markdown") {
    const markdown = formatComparisonMarkdown(createComparisonReport(reportOptions));
    if (!output) {
      console.log(markdown);
      return;
    }

    const outputPath = path.resolve(root, output);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${markdown.trim()}\n`, "utf8");
    console.error(`Wrote ${outputPath}`);
    return;
  }

  const outputPath = path.resolve(root, output ?? "readme-forge-report.html");
  const html = renderComparisonHtml(reportOptions);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, "utf8");
  console.log(`Wrote ${outputPath}`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv[0] === "doctor") {
    await runDoctor(argv.slice(1));
    return;
  }

  if (argv[0] === "compare") {
    await runCompare(argv.slice(1));
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
      profile: profile as QualityProfile,
      template: template as TemplatePreset
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
    console.log(formatUnifiedDiff(existing, readme));
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
