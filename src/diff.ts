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

function lines(value: string): string[] {
  const normalized = value.replace(/\r\n/g, "\n").trimEnd();
  return normalized ? normalized.split("\n") : [];
}

function positionalDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  const max = Math.max(oldLines.length, newLines.length);

  for (let index = 0; index < max; index += 1) {
    const oldValue = oldLines[index];
    const newValue = newLines[index];
    if (oldValue === newValue && oldValue !== undefined) {
      result.push({ type: "unchanged", value: oldValue, oldLine: index + 1, newLine: index + 1 });
      continue;
    }
    if (oldValue !== undefined) result.push({ type: "removed", value: oldValue, oldLine: index + 1 });
    if (newValue !== undefined) result.push({ type: "added", value: newValue, newLine: index + 1 });
  }

  return result;
}

export function diffLines(existing: string, generated: string): DiffLine[] {
  const oldLines = lines(existing);
  const newLines = lines(generated);

  // Bound memory for unusually large generated files while keeping normal README diffs exact.
  if (oldLines.length * newLines.length > 4_000_000) {
    return positionalDiff(oldLines, newLines);
  }

  const matrix = Array.from({ length: oldLines.length + 1 }, () => new Uint32Array(newLines.length + 1));
  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      matrix[oldIndex][newIndex] = oldLines[oldIndex] === newLines[newIndex]
        ? matrix[oldIndex + 1][newIndex + 1] + 1
        : Math.max(matrix[oldIndex + 1][newIndex], matrix[oldIndex][newIndex + 1]);
    }
  }

  const result: DiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  while (oldIndex < oldLines.length && newIndex < newLines.length) {
    if (oldLines[oldIndex] === newLines[newIndex]) {
      result.push({
        type: "unchanged",
        value: oldLines[oldIndex],
        oldLine: oldIndex + 1,
        newLine: newIndex + 1
      });
      oldIndex += 1;
      newIndex += 1;
    } else if (matrix[oldIndex + 1][newIndex] >= matrix[oldIndex][newIndex + 1]) {
      result.push({ type: "removed", value: oldLines[oldIndex], oldLine: oldIndex + 1 });
      oldIndex += 1;
    } else {
      result.push({ type: "added", value: newLines[newIndex], newLine: newIndex + 1 });
      newIndex += 1;
    }
  }

  while (oldIndex < oldLines.length) {
    result.push({ type: "removed", value: oldLines[oldIndex], oldLine: oldIndex + 1 });
    oldIndex += 1;
  }
  while (newIndex < newLines.length) {
    result.push({ type: "added", value: newLines[newIndex], newLine: newIndex + 1 });
    newIndex += 1;
  }

  return result;
}

export function summarizeDiff(diff: DiffLine[]): DiffSummary {
  return {
    additions: diff.filter((line) => line.type === "added").length,
    removals: diff.filter((line) => line.type === "removed").length,
    unchanged: diff.filter((line) => line.type === "unchanged").length
  };
}

export function formatUnifiedDiff(existing: string, generated: string): string {
  const diff = diffLines(existing, generated);
  const summary = summarizeDiff(diff);
  if (!summary.additions && !summary.removals) return "README is already in sync with generated output.";

  return [
    "--- README.md",
    "+++ generated README.md",
    ...diff.map((line) => `${line.type === "added" ? "+" : line.type === "removed" ? "-" : " "} ${line.value}`)
  ].join("\n");
}
