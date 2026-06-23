export type DiffLine = {
    newLine?: number;
    oldLine?: number;
    type: "added" | "removed" | "unchanged";
    value: string;
};
export type DiffSummary = {
    additions: number;
    removals: number;
    unchanged: number;
};
export declare function diffLines(existing: string, generated: string): DiffLine[];
export declare function summarizeDiff(diff: DiffLine[]): DiffSummary;
export declare function formatUnifiedDiff(existing: string, generated: string): string;
