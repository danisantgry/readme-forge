export type ProjectFacts = {
    name: string;
    description: string;
    packageManager: "npm" | "pnpm" | "yarn" | "unknown";
    languages: string[];
    frameworks: string[];
    scripts: Record<string, string>;
    files: string[];
    license?: string;
};
export declare function analyzeProject(root: string): Promise<ProjectFacts>;
