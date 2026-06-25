import { type ComparisonReport } from "./compare.js";
import { type DoctorReport } from "./doctor.js";
export type ReviewBundleInput = {
    ai?: boolean;
    doctorReport: DoctorReport;
    existing: string;
    generated: string;
    outputDir: string;
    readmePath: string;
    root: string;
};
export type ReviewBundleFiles = {
    compareHtml: string;
    compareMarkdown: string;
    doctorMarkdown: string;
    generatedReadme: string;
    indexMarkdown: string;
    prComment: string;
    summaryJson: string;
};
export type ReviewBundleResult = {
    comparison: ComparisonReport;
    directory: string;
    files: ReviewBundleFiles;
};
export declare function writeReviewBundle(input: ReviewBundleInput): Promise<ReviewBundleResult>;
