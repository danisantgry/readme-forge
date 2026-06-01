import type { ProjectFacts } from "./analyzer.js";
export type TemplatePreset = "auto" | "cli" | "library" | "web";
export declare function generateReadme(facts: ProjectFacts, preset?: TemplatePreset): string;
