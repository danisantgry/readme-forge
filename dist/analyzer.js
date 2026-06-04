import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
async function readJson(filePath) {
    try {
        return JSON.parse(await readFile(filePath, "utf8"));
    }
    catch {
        return undefined;
    }
}
async function readText(filePath) {
    try {
        return await readFile(filePath, "utf8");
    }
    catch {
        return "";
    }
}
function readTomlString(source, key) {
    return source.match(new RegExp(`^${key}\\s*=\\s*["']([^"']+)["']`, "m"))?.[1];
}
function readGoModuleName(source) {
    const modulePath = source.match(/^module\s+(\S+)/m)?.[1];
    return modulePath?.split("/").filter(Boolean).at(-1);
}
function firstText(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim())
            return value;
    }
    return undefined;
}
const ignoredEntries = new Set([".git", "node_modules", "dist", "coverage"]);
async function listProjectEntries(root) {
    const entries = await readdir(root, { withFileTypes: true });
    return entries
        .filter((entry) => !ignoredEntries.has(entry.name))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));
}
function detectPackageManager(files) {
    if (files.includes("pnpm-lock.yaml"))
        return "pnpm";
    if (files.includes("yarn.lock"))
        return "yarn";
    if (files.includes("package-lock.json"))
        return "npm";
    return files.includes("package.json") ? "npm" : "unknown";
}
export async function analyzeProject(root) {
    const files = await listProjectEntries(root);
    const packageJson = await readJson(path.join(root, "package.json"));
    const pyproject = files.includes("pyproject.toml") ? await readText(path.join(root, "pyproject.toml")) : "";
    const cargoToml = files.includes("Cargo.toml") ? await readText(path.join(root, "Cargo.toml")) : "";
    const goMod = files.includes("go.mod") ? await readText(path.join(root, "go.mod")) : "";
    const dependencies = {
        ...packageJson?.dependencies,
        ...packageJson?.devDependencies
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
    ].filter(Boolean);
    const languages = [
        files.includes("tsconfig.json") ? "TypeScript" : undefined,
        files.includes("package.json") ? "JavaScript" : undefined,
        files.includes("requirements.txt") || files.includes("pyproject.toml") ? "Python" : undefined,
        files.includes("Cargo.toml") ? "Rust" : undefined,
        files.includes("go.mod") ? "Go" : undefined
    ].filter(Boolean);
    return {
        name: firstText(packageJson?.name, readTomlString(pyproject, "name"), readTomlString(cargoToml, "name"), readGoModuleName(goMod)) ?? path.basename(root),
        description: firstText(packageJson?.description, readTomlString(pyproject, "description"), readTomlString(cargoToml, "description")) ?? "A useful software project.",
        packageManager: detectPackageManager(files),
        languages,
        frameworks,
        scripts: packageJson?.scripts ?? {},
        files,
        license: firstText(packageJson?.license, readTomlString(pyproject, "license"), readTomlString(cargoToml, "license"), files.includes("LICENSE") ? "See LICENSE" : undefined) ?? ""
    };
}
