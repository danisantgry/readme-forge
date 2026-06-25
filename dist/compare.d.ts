import type { ProjectFacts } from "./analyzer.js";
import { type QualityProfile, type ReadmeQualityReport } from "./quality.js";
export type ComparisonReportOptions = {
    existing: string;
    facts: ProjectFacts;
    generated: string;
    profile?: QualityProfile;
    readmePath: string;
    root: string;
};
export type ComparisonReport = {
    changed: boolean;
    current: {
        label: string;
        quality: ReadmeQualityReport;
    };
    detected: string[];
    diff: {
        additions: number;
        removals: number;
        unchanged: number;
    };
    generated: {
        label: string;
        quality: ReadmeQualityReport;
    };
    improvement: number;
    profile: QualityProfile;
    project: {
        name: string;
        packageManager: ProjectFacts["packageManager"];
        readmePath: string;
    };
};
export declare function createComparisonReport(options: ComparisonReportOptions): ComparisonReport;
export declare function formatComparisonMarkdown(report: ComparisonReport): string;
export declare function renderComparisonHtml(options: ComparisonReportOptions): string;
