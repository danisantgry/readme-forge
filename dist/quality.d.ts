import type { ProjectFacts } from "./analyzer.js";
export type QualityIssue = {
    id: string;
    message: string;
};
export declare function checkReadmeQuality(readme: string, facts: ProjectFacts): QualityIssue[];
