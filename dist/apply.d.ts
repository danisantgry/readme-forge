export type ApplyOptions = {
    bundleDir: string;
    dryRun?: boolean;
    force?: boolean;
    readmePath?: string;
    root: string;
};
export type ApplyResult = {
    backupPath?: string;
    changed: boolean;
    dryRun: boolean;
    generatedHash: string;
    sourcePath: string;
    targetPath: string;
};
export declare function applyReadmeFromBundle(options: ApplyOptions): Promise<ApplyResult>;
