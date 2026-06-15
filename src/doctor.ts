import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { analyzeProject, type ProjectFacts } from "./analyzer.js";
import { generateReadme, type TemplatePreset } from "./generator.js";
import { assessReadmeQuality, type QualityProfile, type ReadmeQualityReport } from "./quality.js";

export type DoctorOptions = {
  badges?: boolean;
  minScore?: number;
  output?: string;
  profile?: QualityProfile;
  root: string;
  template?: TemplatePreset;
};

export type DoctorRecommendation = {
  command?: string;
  id: string;
  message: string;
};

export type AdoptionStatus = {
  configPath: string;
  hasConfig: boolean;
  hasReadmeWorkflow: boolean;
  workflowPath?: string;
};

export type DoctorReport = {
  adoption: AdoptionStatus;
  facts: ProjectFacts;
  ok: boolean;
  readme: {
    changedFromGenerated: boolean;
    exists: boolean;
    minimumScore?: number;
    passedMinimumScore: boolean;
    path: string;
    quality: ReadmeQualityReport;
  };
  recommendations: DoctorRecommendation[];
  root: string;
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findReadmeWorkflow(root: string): Promise<string | undefined> {
  const workflowsRoot = path.join(root, ".github", "workflows");
  const entries = await readdir(workflowsRoot, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (!entry.isFile() || !/\.(ya?ml)$/i.test(entry.name)) continue;
    const workflowPath = path.join(workflowsRoot, entry.name);
    const source = await readFile(workflowPath, "utf8").catch(() => "");
    if (source.includes("readme-forge")) return workflowPath;
  }

  return undefined;
}

function relativeCommandPath(root: string, targetPath: string): string {
  const relativePath = path.relative(root, targetPath).replaceAll("\\", "/");
  return relativePath && !relativePath.startsWith("..") ? relativePath : targetPath;
}

function buildRecommendations(report: Omit<DoctorReport, "recommendations" | "ok">): DoctorRecommendation[] {
  const recommendations: DoctorRecommendation[] = [];

  if (!report.readme.exists) {
    recommendations.push({
      id: "create-readme",
      message: "Create a README from detected project metadata.",
      command: "readme-forge ."
    });
  } else if (report.readme.changedFromGenerated) {
    recommendations.push({
      id: "review-generated-diff",
      message: "Review how the generated README differs from the committed README.",
      command: "readme-forge . --diff"
    });
  }

  for (const issue of report.readme.quality.issues) {
    recommendations.push({
      id: issue.id,
      message: issue.message
    });
  }

  if (report.readme.minimumScore !== undefined && !report.readme.passedMinimumScore) {
    recommendations.push({
      id: "minimum-score",
      message: `Raise README quality to at least ${report.readme.minimumScore}%.`,
      command: `readme-forge . --check --min-score ${report.readme.minimumScore}`
    });
  }

  if (!report.adoption.hasConfig) {
    recommendations.push({
      id: "add-config",
      message: "Add versioned readme-forge defaults for repeatable local and CI checks.",
      command: "readme-forge init . --dry-run"
    });
  }

  if (!report.adoption.hasReadmeWorkflow) {
    recommendations.push({
      id: "add-readme-workflow",
      message: "Add a README quality workflow so pull requests cannot silently regress documentation.",
      command: "readme-forge init . --github-actions --dry-run"
    });
  }

  return recommendations;
}

export async function createDoctorReport(options: DoctorOptions): Promise<DoctorReport> {
  const root = path.resolve(options.root);
  const readmePath = path.resolve(options.output ?? path.join(root, "README.md"));
  const facts = await analyzeProject(root);
  const existingReadme = await readFile(readmePath, "utf8").catch(() => "");
  const generatedReadme = generateReadme(facts, options.template ?? "auto", { badges: options.badges });
  const readmeExists = await exists(readmePath);
  const quality = assessReadmeQuality(existingReadme, facts, options.profile ?? "maintainer");
  const passedMinimumScore = options.minScore === undefined || quality.percentage >= options.minScore;
  const workflowPath = await findReadmeWorkflow(root);
  const baseReport = {
    root,
    facts,
    readme: {
      changedFromGenerated: existingReadme.trimEnd() !== generatedReadme.trimEnd(),
      exists: readmeExists,
      minimumScore: options.minScore,
      passedMinimumScore,
      path: readmePath,
      quality
    },
    adoption: {
      configPath: path.join(root, "readme-forge.config.json"),
      hasConfig: await exists(path.join(root, "readme-forge.config.json")),
      hasReadmeWorkflow: workflowPath !== undefined,
      workflowPath
    }
  };
  const recommendations = buildRecommendations(baseReport);
  const ok =
    readmeExists &&
    passedMinimumScore &&
    quality.issues.length === 0 &&
    !baseReport.readme.changedFromGenerated &&
    baseReport.adoption.hasConfig &&
    baseReport.adoption.hasReadmeWorkflow;

  return { ...baseReport, ok, recommendations };
}

function statusLabel(passed: boolean): string {
  return passed ? "OK" : "TODO";
}

function reportStatus(report: DoctorReport): string {
  if (!report.readme.exists || !report.readme.passedMinimumScore || report.readme.quality.issues.length) {
    return "needs attention";
  }
  return report.ok ? "ready" : "ready with follow-ups";
}

export function formatDoctorReport(report: DoctorReport): string {
  const facts = [
    report.facts.languages.length ? report.facts.languages.join(", ") : "unknown language",
    report.facts.frameworks.length ? report.facts.frameworks.join(", ") : undefined,
    `package manager: ${report.facts.packageManager}`
  ].filter(Boolean);
  const workflowPath = report.adoption.workflowPath ? relativeCommandPath(report.root, report.adoption.workflowPath) : "not found";
  const recommendations = report.recommendations.length
    ? report.recommendations.map((item) => `- ${item.message}${item.command ? `\n  ${item.command}` : ""}`).join("\n")
    : "- No immediate documentation actions.";

  return `readme-forge doctor

Project: ${report.facts.name}
Root: ${report.root}
Detected: ${facts.join("; ")}

README
- ${statusLabel(report.readme.exists)} ${relativeCommandPath(report.root, report.readme.path)}
- Score: ${report.readme.quality.score}/${report.readme.quality.maxScore} (${report.readme.quality.percentage}%)
- Profile: ${report.readme.quality.profile}
- Generated diff: ${report.readme.changedFromGenerated ? "available" : "in sync"}
${report.readme.minimumScore !== undefined ? `- Minimum score: ${report.readme.minimumScore}% (${report.readme.passedMinimumScore ? "passed" : "failed"})\n` : ""}
Adoption
- ${statusLabel(report.adoption.hasConfig)} readme-forge.config.json
- ${statusLabel(report.adoption.hasReadmeWorkflow)} README workflow: ${workflowPath}

Recommended next actions
${recommendations}

Status: ${reportStatus(report)}`;
}
