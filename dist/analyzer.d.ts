export type WorkspacePackage = {
    name: string;
    path: string;
    description: string;
};
export type WorkspaceSummary = {
    manager: "npm" | "pnpm" | "yarn";
    patterns: string[];
    packages: WorkspacePackage[];
};
export type ProjectFacts = {
    name: string;
    description: string;
    packageManager: "npm" | "pnpm" | "yarn" | "unknown";
    languages: string[];
    frameworks: string[];
    scripts: Record<string, string>;
    files: string[];
    license?: string;
    workspaces?: WorkspaceSummary;
};
export declare function analyzeProject(root: string): Promise<ProjectFacts>;
