import { readFile } from "node:fs/promises";
import path from "node:path";
import type { TemplatePreset } from "./generator.js";
import type { QualityProfile } from "./quality.js";

export type OutputFormat = "markdown" | "json";

export type ReadmeForgeConfig = {
  ai?: boolean;
  format?: OutputFormat;
  minScore?: number;
  output?: string;
  profile?: QualityProfile;
  template?: TemplatePreset;
};

const validTemplates = new Set(["auto", "cli", "library", "web"]);
const validFormats = new Set(["markdown", "json"]);
const validProfiles = new Set(["basic", "standard", "maintainer", "strict"]);

function assertBoolean(value: unknown, key: string): asserts value is boolean | undefined {
  if (value !== undefined && typeof value !== "boolean") {
    throw new Error(`Config field "${key}" must be a boolean`);
  }
}

function assertString(value: unknown, key: string): asserts value is string | undefined {
  if (value !== undefined && typeof value !== "string") {
    throw new Error(`Config field "${key}" must be a string`);
  }
}

function assertMinScore(value: unknown): asserts value is number | undefined {
  if (value !== undefined && (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100)) {
    throw new Error('Config field "minScore" must be an integer between 0 and 100');
  }
}

export function parseConfig(source: string, configPath = "readme-forge.config.json"): ReadmeForgeConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error(`Could not parse ${configPath} as JSON`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${configPath} must contain a JSON object`);
  }

  const config = parsed as Record<string, unknown>;
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
    format: config.format as OutputFormat | undefined,
    minScore: config.minScore,
    output: config.output,
    profile: config.profile as QualityProfile | undefined,
    template: config.template as TemplatePreset | undefined
  };
}

export async function loadConfig(root: string, configPath?: string): Promise<ReadmeForgeConfig> {
  const resolvedPath = configPath ? path.resolve(configPath) : path.join(root, "readme-forge.config.json");
  try {
    return parseConfig(await readFile(resolvedPath, "utf8"), resolvedPath);
  } catch (error) {
    if (!configPath && error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}
