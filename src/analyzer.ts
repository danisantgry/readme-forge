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
};

async function readJson(filePath: string): Promise<Record<string, unknown> | undefined> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function detectPackageManager(files: string[]): ProjectFacts["packageManager"] {
  if (files.includes("pnpm-lock.yaml")) return "pnpm";
  if (files.includes("yarn.lock")) return "yarn";
  if (files.includes("package-lock.json")) return "npm";
  return files.includes("package.json") ? "npm" : "unknown";
}

export async function analyzeProject(root: string): Promise<ProjectFacts> {
  const files = await readdir(root);
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
    files.includes("pyproject.toml") ? "Python package" : undefined
  ].filter(Boolean) as string[];

  const languages = [
    files.includes("tsconfig.json") ? "TypeScript" : undefined,
    files.includes("package.json") ? "JavaScript" : undefined,
    files.includes("requirements.txt") || files.includes("pyproject.toml") ? "Python" : undefined
  ].filter(Boolean) as string[];

  return {
    name: String(packageJson?.name ?? path.basename(root)),
    description: String(packageJson?.description ?? "A useful software project."),
    packageManager: detectPackageManager(files),
    languages,
    frameworks,
    scripts: (packageJson?.scripts as Record<string, string> | undefined) ?? {},
    files
  };
}
