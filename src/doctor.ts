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

function installRecommendation(facts: ProjectFacts): DoctorRecommendation | undefined {
  if (facts.packageManager === "pnpm") {
    return {
      id: "document-install-command",
      message: "Document the detected pnpm install command.",
      command: "pnpm install"
    };
  }
  if (facts.packageManager === "yarn") {
    return {
      id: "document-install-command",
      message: "Document the detected yarn install command.",
      command: "yarn"
    };
  }
  if (facts.packageManager === "npm") {
    return {
      id: "document-install-command",
      message: "Document the detected npm install command.",
      command: "npm install"
    };
  }
  if (facts.languages.includes("Python")) {
    return {
      id: "document-python-install-command",
      message: "Document editable Python package installation for local development.",
      command: "python -m pip install -e ."
    };
  }
  if (facts.languages.includes("Rust")) {
    return {
      id: "document-rust-build-command",
      message: "Document the Rust build command for contributors.",
      command: "cargo build"
    };
  }
  if (facts.languages.includes("Go")) {
    return {
      id: "document-go-dependency-command",
      message: "Document how Go contributors download module dependencies.",
      command: "go mod download"
    };
  }
  return undefined;
}

function scriptCommand(facts: ProjectFacts, script: string): string {
  if (facts.packageManager === "pnpm") return `pnpm ${script}`;
  if (facts.packageManager === "yarn") return `yarn ${script}`;
  return `npm run ${script}`;
}

function detectedShape(facts: ProjectFacts): "cli" | "library" | "web" {
  if (facts.frameworks.some((name) => ["Vite", "Next.js", "React"].includes(name))) return "web";
  if (facts.frameworks.some((name) => ["Python package", "Rust crate", "Go module"].includes(name))) return "library";
  if (facts.scripts.dev || facts.scripts.start || facts.files.includes("src")) return "cli";
  return "library";
}

function addRecommendation(recommendations: DoctorRecommendation[], recommendation: DoctorRecommendation): void {
  if (!recommendations.some((existing) => existing.id === recommendation.id)) {
    recommendations.push(recommendation);
  }
}

function ecosystemRecommendations(report: Omit<DoctorReport, "recommendations" | "ok">): DoctorRecommendation[] {
  const recommendations: DoctorRecommendation[] = [];
  const issueIds = new Set(report.readme.quality.issues.map((issue) => issue.id));
  const needsReadmeWork = !report.readme.exists || report.readme.changedFromGenerated || report.readme.quality.issues.length > 0;
  if (!needsReadmeWork) return recommendations;

  if (!report.readme.exists || issueIds.has("missing-install")) {
    const recommendation = installRecommendation(report.facts);
    if (recommendation) addRecommendation(recommendations, recommendation);
  }

  if (report.facts.scripts.dev && (!report.readme.exists || issueIds.has("missing-scripts") || issueIds.has("missing-install"))) {
    addRecommendation(recommendations, {
      id: "document-dev-command",
      message: "Document the local development command declared in package scripts.",
      command: scriptCommand(report.facts, "dev")
    });
  }

  if (report.facts.scripts.build && (!report.readme.exists || issueIds.has("missing-scripts"))) {
    addRecommendation(recommendations, {
      id: "document-build-command",
      message: "Document the build command declared in package scripts.",
      command: scriptCommand(report.facts, "build")
    });
  }

  if (report.facts.scripts.test && (!report.readme.exists || issueIds.has("missing-tests"))) {
    addRecommendation(recommendations, {
      id: "document-test-command",
      message: "Document the test command declared in package scripts.",
      command: scriptCommand(report.facts, "test")
    });
  }

  if (!report.facts.scripts.test && needsReadmeWork) {
    if (report.facts.languages.includes("Python")) {
      addRecommendation(recommendations, {
        id: "document-python-test-command",
        message: "Document the Python test command when the project has a test runner.",
        command: "python -m pytest"
      });
    }
    if (report.facts.languages.includes("Rust")) {
      addRecommendation(recommendations, {
        id: "document-rust-test-command",
        message: "Document the Rust test command for crate contributors.",
        command: "cargo test"
      });
    }
    if (report.facts.languages.includes("Go")) {
      addRecommendation(recommendations, {
        id: "document-go-test-command",
        message: "Document the Go test command for module contributors.",
        command: "go test ./..."
      });
    }
  }

  if (report.facts.workspaces) {
    addRecommendation(recommendations, {
      id: "document-workspace-summary",
      message: `Document ${report.facts.workspaces.packages.length} detected workspace package${report.facts.workspaces.packages.length === 1 ? "" : "s"} and their paths.`,
      command: "readme-forge . --template auto --dry-run"
    });
  }

  const shape = detectedShape(report.facts);
  if (shape === "web") {
    addRecommendation(recommendations, {
      id: "add-web-local-development-example",
      message: "Add a web app local development example so contributors can start the app quickly.",
      command: "readme-forge . --template web --dry-run"
    });
  } else if (shape === "cli") {
    addRecommendation(recommendations, {
      id: "add-cli-usage-example",
      message: "Add a CLI usage example so users can see the command workflow before installing.",
      command: "readme-forge . --template cli --dry-run"
    });
  } else {
    addRecommendation(recommendations, {
      id: "add-library-usage-example",
      message: "Add a library usage example grounded in the detected package metadata.",
      command: "readme-forge . --template library --dry-run"
    });
  }

  return recommendations;
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

  for (const recommendation of ecosystemRecommendations(report)) {
    addRecommendation(recommendations, recommendation);
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

function tableValue(value: string | number): string {
  return String(value).replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

function tableRow(label: string, value: string | number): string {
  return `| ${tableValue(label)} | ${tableValue(value)} |`;
}

function markdownCode(value: string): string {
  return `\`${value.replaceAll("`", "\\`")}\``;
}

function formatRecommendation(item: DoctorRecommendation, index: number): string {
  const command = item.command ? `\n\n\`\`\`bash\n${item.command}\n\`\`\`` : "";
  return `${index + 1}. ${item.message}${command}`;
}

export function formatDoctorReport(report: DoctorReport): string {
  const facts = [
    report.facts.languages.length ? report.facts.languages.join(", ") : "unknown language",
    report.facts.frameworks.length ? report.facts.frameworks.join(", ") : undefined,
    `package manager: ${report.facts.packageManager}`
  ].filter(Boolean);
  const workflowPath = report.adoption.workflowPath ? relativeCommandPath(report.root, report.adoption.workflowPath) : "not found";
  const recommendations = report.recommendations.length
    ? report.recommendations.map(formatRecommendation).join("\n\n")
    : "No immediate documentation actions.";

  const minimumScore =
    report.readme.minimumScore !== undefined
      ? `${report.readme.minimumScore}% (${report.readme.passedMinimumScore ? "passed" : "failed"})`
      : "not configured";

  return `# readme-forge doctor

## Project

| Field | Value |
| --- | --- |
${tableRow("Name", report.facts.name)}
${tableRow("Root", report.root)}
${tableRow("Detected", facts.join("; "))}

## README

| Check | Value |
| --- | --- |
${tableRow("Path", markdownCode(relativeCommandPath(report.root, report.readme.path)))}
${tableRow("Exists", statusLabel(report.readme.exists))}
${tableRow("Score", `${report.readme.quality.score}/${report.readme.quality.maxScore} (${report.readme.quality.percentage}%)`)}
${tableRow("Profile", report.readme.quality.profile)}
${tableRow("Generated diff", report.readme.changedFromGenerated ? "available" : "in sync")}
${tableRow("Minimum score", minimumScore)}

## Adoption

| Check | Status |
| --- | --- |
${tableRow(markdownCode("readme-forge.config.json"), statusLabel(report.adoption.hasConfig))}
${tableRow("README workflow", `${statusLabel(report.adoption.hasReadmeWorkflow)} - ${workflowPath}`)}

## Recommended Next Actions

${recommendations}

## Status

${reportStatus(report)}`;
}
