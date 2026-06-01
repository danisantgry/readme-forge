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
    const files = await readdir(root);
    const packageJson = await readJson(path.join(root, "package.json"));
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
        name: String(packageJson?.name ?? path.basename(root)),
        description: String(packageJson?.description ?? "A useful software project."),
        packageManager: detectPackageManager(files),
        languages,
        frameworks,
        scripts: packageJson?.scripts ?? {},
        files,
        license: String(packageJson?.license ?? (files.includes("LICENSE") ? "See LICENSE" : ""))
    };
}
