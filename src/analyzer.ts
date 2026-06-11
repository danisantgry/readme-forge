import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type WorkspacePackage = {
  name: string;
  path: string;
  description: string;
};

export type WorkspaceSummary = {
  manager: "npm" | "pnpm" | "yarn";
  patterns: string[];
  packages: WorkspacePackage[];
};

export type RepositoryInfo = {
  url: string;
  owner?: string;
  name?: string;
};

export type ProjectFacts = {
  name: string;
  description: string;
  packageName?: string;
  packageManager: "npm" | "pnpm" | "yarn" | "unknown";
  privatePackage: boolean;
  repository?: RepositoryInfo;
  languages: string[];
  frameworks: string[];
  scripts: Record<string, string>;
  files: string[];
  license?: string;
  workspaces?: WorkspaceSummary;
};

async function readJson(filePath: string): Promise<Record<string, unknown> | undefined> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

async function readText(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function readTomlString(source: string, key: string): string | undefined {
  return source.match(new RegExp(`^${key}\\s*=\\s*["']([^"']+)["']`, "m"))?.[1];
}

function readGoModuleName(source: string): string | undefined {
  const modulePath = source.match(/^module\s+(\S+)/m)?.[1];
  return modulePath?.split("/").filter(Boolean).at(-1);
}

function firstText(...values: Array<unknown>): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function readRepositoryUrl(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object" && typeof (value as { url?: unknown }).url === "string") {
    return (value as { url: string }).url;
  }
  return undefined;
}

function parseGitHubRepository(url: string): RepositoryInfo {
  const normalized = url
    .replace(/^git\+/, "")
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/\.git$/, "");
  const match = normalized.match(/github\.com[:/](?<owner>[^/\s]+)\/(?<name>[^/\s#?]+)/i);

  return {
    url: normalized,
    owner: match?.groups?.owner,
    name: match?.groups?.name
  };
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
  if (files.includes("pnpm-workspace.yaml")) return "pnpm";
  if (files.includes("pnpm-lock.yaml")) return "pnpm";
  if (files.includes("yarn.lock")) return "yarn";
  if (files.includes("package-lock.json")) return "npm";
  return files.includes("package.json") ? "npm" : "unknown";
}

function normalizeWorkspacePatterns(patterns: unknown): string[] {
  if (Array.isArray(patterns)) {
    return patterns.filter((pattern): pattern is string => typeof pattern === "string");
  }
  if (patterns && typeof patterns === "object" && Array.isArray((patterns as { packages?: unknown }).packages)) {
    return (patterns as { packages: unknown[] }).packages.filter((pattern): pattern is string => typeof pattern === "string");
  }
  return [];
}

function readPnpmWorkspacePatterns(source: string): string[] {
  const lines = source.split(/\r?\n/);
  const patterns: string[] = [];
  let insidePackages = false;

  for (const line of lines) {
    if (/^packages:\s*$/.test(line)) {
      insidePackages = true;
      continue;
    }
    if (insidePackages && /^\S/.test(line)) break;
    const match = insidePackages ? line.match(/^\s*-\s*['"]?([^'"]+)['"]?\s*$/) : undefined;
    if (match) patterns.push(match[1]);
  }

  return patterns;
}

async function pathExistsAsDirectory(root: string, relativePath: string): Promise<boolean> {
  try {
    const entries = await readdir(path.join(root, relativePath), { withFileTypes: true });
    return entries.length >= 0;
  } catch {
    return false;
  }
}

async function expandWorkspacePattern(root: string, pattern: string): Promise<string[]> {
  const normalized = pattern.replaceAll("\\", "/").replace(/\/+$/, "");
  if (normalized.includes("**") || normalized.startsWith("!")) return [];
  if (!normalized.includes("*")) return (await pathExistsAsDirectory(root, normalized)) ? [normalized] : [];

  const parts = normalized.split("/");
  const starIndex = parts.indexOf("*");
  if (starIndex < 0 || starIndex !== parts.length - 1) return [];

  const base = parts.slice(0, starIndex).join("/");
  const entries = await readdir(path.join(root, base || "."), { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory() && !ignoredEntries.has(entry.name))
    .map((entry) => (base ? `${base}/${entry.name}` : entry.name))
    .sort((a, b) => a.localeCompare(b));
}

async function detectWorkspaces(root: string, files: string[], packageJson: Record<string, unknown> | undefined): Promise<WorkspaceSummary | undefined> {
  const pnpmWorkspace = files.includes("pnpm-workspace.yaml") ? await readText(path.join(root, "pnpm-workspace.yaml")) : "";
  const manager = pnpmWorkspace ? "pnpm" : files.includes("yarn.lock") ? "yarn" : "npm";
  const patterns = pnpmWorkspace ? readPnpmWorkspacePatterns(pnpmWorkspace) : normalizeWorkspacePatterns(packageJson?.workspaces);
  const packagePaths = [...new Set((await Promise.all(patterns.map((pattern) => expandWorkspacePattern(root, pattern)))).flat())];
  const packages: WorkspacePackage[] = [];

  for (const packagePath of packagePaths.slice(0, 25)) {
    const workspacePackageJson = await readJson(path.join(root, packagePath, "package.json"));
    if (!workspacePackageJson) continue;
    packages.push({
      name: firstText(workspacePackageJson.name) ?? packagePath,
      path: packagePath,
      description: firstText(workspacePackageJson.description) ?? ""
    });
  }

  if (!patterns.length && !packages.length) return undefined;
  return { manager, patterns, packages };
}

export async function analyzeProject(root: string): Promise<ProjectFacts> {
  const files = await listProjectEntries(root);
  const packageJson = await readJson(path.join(root, "package.json"));
  const pyproject = files.includes("pyproject.toml") ? await readText(path.join(root, "pyproject.toml")) : "";
  const cargoToml = files.includes("Cargo.toml") ? await readText(path.join(root, "Cargo.toml")) : "";
  const goMod = files.includes("go.mod") ? await readText(path.join(root, "go.mod")) : "";
  const workspaces = await detectWorkspaces(root, files, packageJson);
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
    name: firstText(packageJson?.name, readTomlString(pyproject, "name"), readTomlString(cargoToml, "name"), readGoModuleName(goMod)) ?? path.basename(root),
    description: firstText(packageJson?.description, readTomlString(pyproject, "description"), readTomlString(cargoToml, "description")) ?? "A useful software project.",
    packageName: firstText(packageJson?.name),
    packageManager: detectPackageManager(files),
    privatePackage: packageJson?.private === true,
    repository: readRepositoryUrl(packageJson?.repository) ? parseGitHubRepository(readRepositoryUrl(packageJson?.repository) as string) : undefined,
    languages,
    frameworks,
    scripts: (packageJson?.scripts as Record<string, string> | undefined) ?? {},
    files,
    license: firstText(packageJson?.license, readTomlString(pyproject, "license"), readTomlString(cargoToml, "license"), files.includes("LICENSE") ? "See LICENSE" : undefined) ?? "",
    workspaces
  };
}
