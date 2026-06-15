import { type ProjectFacts } from "./analyzer.js";
import { type TemplatePreset } from "./generator.js";
import { type QualityProfile, type ReadmeQualityReport } from "./quality.js";
export type DoctorOptions = {
    badges?: boolean;
    minScore?: number;
    output?: string;
    profile?: QualityProfile;
    root: string;
    template?: TemplatePreset;
};
export type DoctorRecommendation = {
    command?: string;
    id: string;
    message: string;
};
export type AdoptionStatus = {
    configPath: string;
    hasConfig: boolean;
    hasReadmeWorkflow: boolean;
    workflowPath?: string;
};
export type DoctorReport = {
    adoption: AdoptionStatus;
    facts: ProjectFacts;
    ok: boolean;
    readme: {
        changedFromGenerated: boolean;
        exists: boolean;
        minimumScore?: number;
        passedMinimumScore: boolean;
        path: string;
        quality: ReadmeQualityReport;
    };
    recommendations: DoctorRecommendation[];
    root: string;
};
export declare function createDoctorReport(options: DoctorOptions): Promise<DoctorReport>;
export declare function formatDoctorReport(report: DoctorReport): string;
