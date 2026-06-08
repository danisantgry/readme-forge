import { readFile } from "node:fs/promises";
import path from "node:path";
const validTemplates = new Set(["auto", "cli", "library", "web"]);
const validFormats = new Set(["markdown", "json"]);
const validProfiles = new Set(["basic", "standard", "maintainer", "strict"]);
function assertBoolean(value, key) {
    if (value !== undefined && typeof value !== "boolean") {
        throw new Error(`Config field "${key}" must be a boolean`);
    }
}
function assertString(value, key) {
    if (value !== undefined && typeof value !== "string") {
        throw new Error(`Config field "${key}" must be a string`);
    }
}
function assertMinScore(value) {
    if (value !== undefined && (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100)) {
        throw new Error('Config field "minScore" must be an integer between 0 and 100');
    }
}
export function parseConfig(source, configPath = "readme-forge.config.json") {
    let parsed;
    try {
        parsed = JSON.parse(source);
    }
    catch {
        throw new Error(`Could not parse ${configPath} as JSON`);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(`${configPath} must contain a JSON object`);
    }
    const config = parsed;
    assertBoolean(config.ai, "ai");
    assertString(config.format, "format");
    assertString(config.output, "output");
    assertString(config.profile, "profile");
    assertString(config.template, "template");
    assertMinScore(config.minScore);
    if (config.template !== undefined && !validTemplates.has(config.template)) {
        throw new Error('Config field "template" must be one of: auto, cli, library, web');
    }
    if (config.format !== undefined && !validFormats.has(config.format)) {
        throw new Error('Config field "format" must be one of: markdown, json');
    }
    if (config.profile !== undefined && !validProfiles.has(config.profile)) {
        throw new Error('Config field "profile" must be one of: basic, standard, maintainer, strict');
    }
    return {
        ai: config.ai,
        format: config.format,
        minScore: config.minScore,
        output: config.output,
        profile: config.profile,
        template: config.template
    };
}
export async function loadConfig(root, configPath) {
    const resolvedPath = configPath ? path.resolve(configPath) : path.join(root, "readme-forge.config.json");
    try {
        return parseConfig(await readFile(resolvedPath, "utf8"), resolvedPath);
    }
    catch (error) {
        if (!configPath && error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
            return {};
        }
        throw error;
    }
}
