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
export type RepositoryInfo = {
    url: string;
    owner?: string;
    name?: string;
};
export type AutomationSignals = {
    ciWorkflows: string[];
    dockerFiles: string[];
    hasMakefile: boolean;
};
export type ProjectFacts = {
    name: string;
    description: string;
    packageName?: string;
    packageManager: "npm" | "pnpm" | "yarn" | "unknown";
    privatePackage: boolean;
    repository?: RepositoryInfo;
    automation: AutomationSignals;
    binCommands: string[];
    configFiles: string[];
    entrypoints: string[];
    environmentFiles: string[];
    languages: string[];
    frameworks: string[];
    scripts: Record<string, string>;
    files: string[];
    license?: string;
    workspaces?: WorkspaceSummary;
};
export declare function analyzeProject(root: string): Promise<ProjectFacts>;
