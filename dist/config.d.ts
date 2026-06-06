import type { TemplatePreset } from "./generator.js";
export type OutputFormat = "markdown" | "json";
export type ReadmeForgeConfig = {
    ai?: boolean;
    format?: OutputFormat;
    minScore?: number;
    output?: string;
    template?: TemplatePreset;
};
export declare function parseConfig(source: string, configPath?: string): ReadmeForgeConfig;
export declare function loadConfig(root: string, configPath?: string): Promise<ReadmeForgeConfig>;
