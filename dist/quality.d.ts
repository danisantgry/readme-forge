import type { ProjectFacts } from "./analyzer.js";
export type QualityIssue = {
    id: string;
    message: string;
};
export type QualityCheck = {
    id: string;
    message: string;
    passed: boolean;
};
export type QualityProfile = "basic" | "standard" | "maintainer" | "strict";
export type ReadmeQualityReport = {
    profile: QualityProfile;
    score: number;
    maxScore: number;
    percentage: number;
    issues: QualityIssue[];
    passedChecks: string[];
    checks: QualityCheck[];
};
export declare function assessReadmeQuality(readme: string, facts: ProjectFacts, profile?: QualityProfile): ReadmeQualityReport;
export declare function checkReadmeQuality(readme: string, facts: ProjectFacts): QualityIssue[];
