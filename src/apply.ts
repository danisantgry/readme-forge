import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

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

type BundleSummary = {
  files?: {
    generatedReadme?: string;
  };
  hashes?: {
    currentReadmeSha256?: string;
    generatedReadmeSha256?: string;
  };
  project?: {
    readmePath?: string;
  };
};

function sha256(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readSummary(bundleDir: string): Promise<BundleSummary> {
  const summaryPath = path.join(bundleDir, "summary.json");
  try {
    return JSON.parse(await readFile(summaryPath, "utf8")) as BundleSummary;
  } catch {
    throw new Error(`Could not read review bundle summary at ${summaryPath}`);
  }
}

function resolveBundleFile(root: string, bundleDir: string, filePath: string | undefined, fallback: string): string {
  if (!filePath) return path.join(bundleDir, fallback);
  return path.resolve(root, filePath);
}

async function nextBackupPath(targetPath: string): Promise<string> {
  const parsed = path.parse(targetPath);
  const base = path.join(parsed.dir, `${parsed.base}.readme-forge-backup`);
  if (!(await exists(base))) return base;

  for (let index = 1; index < 1000; index += 1) {
    const candidate = `${base}.${index}`;
    if (!(await exists(candidate))) return candidate;
  }

  throw new Error(`Could not find an available backup path for ${targetPath}`);
}

export async function applyReadmeFromBundle(options: ApplyOptions): Promise<ApplyResult> {
  const root = path.resolve(options.root);
  const bundleDir = path.resolve(root, options.bundleDir);
  const summary = await readSummary(bundleDir);
  const sourcePath = resolveBundleFile(root, bundleDir, summary.files?.generatedReadme, "README.generated.md");
  const targetPath = path.resolve(root, options.readmePath ?? summary.project?.readmePath ?? "README.md");
  const generated = await readFile(sourcePath, "utf8");
  const generatedHash = sha256(generated);
  const expectedGeneratedHash = summary.hashes?.generatedReadmeSha256;

  if (expectedGeneratedHash && expectedGeneratedHash !== generatedHash) {
    throw new Error(`Generated README hash mismatch for ${sourcePath}. Re-run readme-forge review before applying.`);
  }

  const existing = await readFile(targetPath, "utf8").catch(() => "");
  const existingHash = sha256(existing);
  if (existing.trimEnd() === generated.trimEnd()) {
    return {
      changed: false,
      dryRun: options.dryRun === true,
      generatedHash,
      sourcePath,
      targetPath
    };
  }

  const expectedExistingHash = summary.hashes?.currentReadmeSha256;

  if (expectedExistingHash && expectedExistingHash !== existingHash && !options.force) {
    throw new Error("README changed after the review bundle was created. Re-run readme-forge review or use --force after checking the diff.");
  }

  const backupPath = await nextBackupPath(targetPath);
  if (!options.dryRun) {
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(backupPath, existing, "utf8");
    await writeFile(targetPath, `${generated.trim()}\n`, "utf8");
  }

  return {
    backupPath,
    changed: true,
    dryRun: options.dryRun === true,
    generatedHash,
    sourcePath,
    targetPath
  };
}
