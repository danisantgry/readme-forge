import type { TemplatePreset } from "./generator.js";
import type { QualityProfile } from "./quality.js";
export type InitOptions = {
    badges?: boolean;
    force?: boolean;
    githubActions?: boolean;
    minScore?: number;
    profile?: QualityProfile;
    root: string;
    template?: TemplatePreset;
};
export type InitPlanEntry = {
    content: string;
    path: string;
};
export type InitWriteResult = {
    planned: InitPlanEntry[];
    skipped: string[];
    written: string[];
};
export declare function createInitPlan(options: InitOptions): InitPlanEntry[];
export declare function writeInitPlan(options: InitOptions): Promise<InitWriteResult>;
