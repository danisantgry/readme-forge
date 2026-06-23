import type { ProjectFacts } from "./analyzer.js";
import { type QualityProfile } from "./quality.js";
export type ComparisonReportOptions = {
    existing: string;
    facts: ProjectFacts;
    generated: string;
    profile?: QualityProfile;
    readmePath: string;
    root: string;
};
export declare function renderComparisonHtml(options: ComparisonReportOptions): string;
