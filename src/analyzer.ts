import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type ProjectFacts = {
  name: string;
  description: string;
  packageManager: "npm" | "pnpm" | "yarn" | "unknown";
  languages: string[];
  frameworks: string[];
  scripts: Record<string, string>;
  files: string[];
  license?: string;
};

async function readJson(filePath: string): Promise<Record<string, unknown> | undefined> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

const ignoredEntries = new Set([".git", "node_modules", "dist", "coverage"]);

async function listProjectEntries(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => !ignoredEntries.has(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function detectPackageManager(files: string[]): ProjectFacts["packageManager"] {
  if (files.includes("pnpm-lock.yaml")) return "pnpm";
  if (files.includes("yarn.lock")) return "yarn";
  if (files.includes("package-lock.json")) return "npm";
  return files.includes("package.json") ? "npm" : "unknown";
}

export async function analyzeProject(root: string): Promise<ProjectFacts> {
  const files = await listProjectEntries(root);
  const packageJson = await readJson(path.join(root, "package.json"));
  const dependencies = {
    ...(packageJson?.dependencies as Record<string, string> | undefined),
    ...(packageJson?.devDependencies as Record<string, string> | undefined)
  };
  const dependencyNames = Object.keys(dependencies);

  const frameworks = [
    dependencyNames.includes("vite") ? "Vite" : undefined,
    dependencyNames.includes("next") ? "Next.js" : undefined,
    dependencyNames.includes("react") ? "React" : undefined,
    dependencyNames.includes("express") ? "Express" : undefined,
    files.includes("pyproject.toml") ? "Python package" : undefined,
    files.includes("Cargo.toml") ? "Rust crate" : undefined,
    files.includes("go.mod") ? "Go module" : undefined
  ].filter(Boolean) as string[];

  const languages = [
    files.includes("tsconfig.json") ? "TypeScript" : undefined,
    files.includes("package.json") ? "JavaScript" : undefined,
    files.includes("requirements.txt") || files.includes("pyproject.toml") ? "Python" : undefined,
    files.includes("Cargo.toml") ? "Rust" : undefined,
    files.includes("go.mod") ? "Go" : undefined
  ].filter(Boolean) as string[];

  return {
    name: String(packageJson?.name ?? path.basename(root)),
    description: String(packageJson?.description ?? "A useful software project."),
    packageManager: detectPackageManager(files),
    languages,
    frameworks,
    scripts: (packageJson?.scripts as Record<string, string> | undefined) ?? {},
    files,
    license: String(packageJson?.license ?? (files.includes("LICENSE") ? "See LICENSE" : ""))
  };
}
