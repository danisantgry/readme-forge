import type { ProjectFacts } from "./analyzer.js";
export type TemplatePreset = "auto" | "cli" | "library" | "web";
export type GenerateReadmeOptions = {
    badges?: boolean;
};
export declare function generateReadme(facts: ProjectFacts, preset?: TemplatePreset, options?: GenerateReadmeOptions): string;
