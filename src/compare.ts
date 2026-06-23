import path from "node:path";
import type { ProjectFacts } from "./analyzer.js";
import { diffLines, summarizeDiff, type DiffLine } from "./diff.js";
import { assessReadmeQuality, type QualityProfile, type ReadmeQualityReport } from "./quality.js";

export type ComparisonReportOptions = {
  existing: string;
  facts: ProjectFacts;
  generated: string;
  profile?: QualityProfile;
  readmePath: string;
  root: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function qualityLabel(report: ReadmeQualityReport): string {
  if (report.percentage === 100) return "Complete";
  if (report.percentage >= 80) return "Strong";
  if (report.percentage >= 60) return "Developing";
  return "Needs work";
}

function lineNumber(value?: number): string {
  return value === undefined ? "" : String(value);
}

function compactDiff(diff: DiffLine[], context = 3): Array<DiffLine | undefined> {
  if (!diff.some((line) => line.type !== "unchanged")) return diff.slice(0, 12);
  const visible = new Set<number>();
  diff.forEach((line, index) => {
    if (line.type === "unchanged") return;
    for (let candidate = Math.max(0, index - context); candidate <= Math.min(diff.length - 1, index + context); candidate += 1) {
      visible.add(candidate);
    }
  });

  const output: Array<DiffLine | undefined> = [];
  let previous = -2;
  for (const index of [...visible].sort((a, b) => a - b)) {
    if (index > previous + 1) output.push(undefined);
    output.push(diff[index]);
    previous = index;
  }
  return output;
}

function renderDiffRow(line: DiffLine | undefined): string {
  if (!line) {
    return '<tr class="skip"><td></td><td></td><td class="marker">...</td><td>unchanged lines</td></tr>';
  }
  const marker = line.type === "added" ? "+" : line.type === "removed" ? "-" : "";
  return `<tr class="${line.type}"><td>${lineNumber(line.oldLine)}</td><td>${lineNumber(line.newLine)}</td><td class="marker">${marker}</td><td><code>${escapeHtml(line.value) || "&nbsp;"}</code></td></tr>`;
}

function renderChecks(existing: ReadmeQualityReport, generated: ReadmeQualityReport): string {
  return existing.checks.map((check) => {
    const generatedCheck = generated.checks.find((item) => item.id === check.id);
    const currentLabel = check.passed ? "PASS" : "MISS";
    const generatedLabel = generatedCheck?.passed ? "PASS" : "MISS";
    return `<tr>
      <td><strong>${escapeHtml(check.id)}</strong><span>${escapeHtml(check.message)}</span></td>
      <td><span class="pill ${check.passed ? "pass" : "miss"}">${currentLabel}</span></td>
      <td><span class="pill ${generatedCheck?.passed ? "pass" : "miss"}">${generatedLabel}</span></td>
    </tr>`;
  }).join("\n");
}

function relativePath(root: string, target: string): string {
  const relative = path.relative(root, target).replaceAll("\\", "/");
  return relative && !relative.startsWith("..") ? relative : target;
}

export function renderComparisonHtml(options: ComparisonReportOptions): string {
  const profile = options.profile ?? "maintainer";
  const existingQuality = assessReadmeQuality(options.existing, options.facts, profile);
  const generatedQuality = assessReadmeQuality(options.generated, options.facts, profile);
  const diff = diffLines(options.existing, options.generated);
  const summary = summarizeDiff(diff);
  const improvement = generatedQuality.percentage - existingQuality.percentage;
  const detected = [...options.facts.languages, ...options.facts.frameworks];
  const diffRows = compactDiff(diff).map(renderDiffRow).join("\n");
  const readmePath = relativePath(options.root, options.readmePath);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.facts.name)} README comparison</title>
  <style>
    :root { color-scheme: dark; --bg: #0c1117; --panel: #151c24; --border: #2b3642; --text: #e8edf2; --muted: #96a5b4; --green: #4fd18b; --red: #ff7b72; --blue: #68a8ff; --amber: #f2c66d; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 36px 0 56px; }
    header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
    h1, h2, p { margin-top: 0; }
    h1 { margin-bottom: 6px; font-size: clamp(26px, 4vw, 38px); line-height: 1.15; letter-spacing: 0; }
    h2 { margin: 0 0 14px; font-size: 18px; letter-spacing: 0; }
    .eyebrow { margin-bottom: 8px; color: var(--blue); font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .muted { color: var(--muted); }
    .meta { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; max-width: 420px; }
    .tag, .pill { border: 1px solid var(--border); border-radius: 999px; padding: 4px 9px; font-size: 12px; font-weight: 750; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 24px 0; }
    .metric { min-height: 126px; padding: 18px; border: 1px solid var(--border); border-radius: 8px; background: var(--panel); }
    .metric > span { display: block; color: var(--muted); font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .metric strong { display: block; margin: 8px 0 2px; font-size: 32px; line-height: 1; }
    .metric small { color: var(--muted); }
    .metric small span { display: inline; margin: 0; font-size: inherit; font-weight: inherit; text-transform: none; }
    .metric.after strong, .positive { color: var(--green); }
    section { padding: 24px 0; border-top: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; overflow: hidden; border: 1px solid var(--border); border-radius: 8px; background: var(--panel); }
    th, td { padding: 12px 14px; border-bottom: 1px solid var(--border); text-align: left; vertical-align: top; }
    th { color: var(--muted); font-size: 12px; text-transform: uppercase; }
    tr:last-child td { border-bottom: 0; }
    td span { display: block; margin-top: 2px; color: var(--muted); font-size: 13px; }
    .pill { display: inline-block; margin: 0; }
    .pill.pass { border-color: #27734d; color: var(--green); background: #123624; }
    .pill.miss { border-color: #7d3535; color: var(--red); background: #3b1c1d; }
    .diff-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; background: #0e141b; }
    .diff { min-width: 720px; border: 0; border-radius: 0; background: transparent; font: 13px/1.45 ui-monospace, SFMono-Regular, Consolas, monospace; }
    .diff td { padding: 2px 10px; border: 0; white-space: pre; }
    .diff td:nth-child(1), .diff td:nth-child(2) { width: 52px; color: #647383; text-align: right; user-select: none; }
    .diff .marker { width: 28px; padding-right: 0; text-align: center; }
    .diff .added { background: #102d20; }
    .diff .removed { background: #351b1e; }
    .diff .added .marker { color: var(--green); }
    .diff .removed .marker { color: var(--red); }
    .diff .skip { color: var(--muted); background: #121922; }
    details { border: 1px solid var(--border); border-radius: 8px; background: var(--panel); }
    summary { cursor: pointer; padding: 14px 16px; font-weight: 750; }
    .sources { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; border-top: 1px solid var(--border); background: var(--border); }
    .source { min-width: 0; padding: 16px; background: #0e141b; }
    .source h3 { margin: 0 0 10px; font-size: 13px; color: var(--muted); }
    pre { max-height: 440px; margin: 0; overflow: auto; white-space: pre; font: 12px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; }
    footer { padding-top: 24px; color: var(--muted); font-size: 13px; }
    @media (max-width: 780px) { header { display: block; } .meta { justify-content: flex-start; margin-top: 16px; } .grid { grid-template-columns: 1fr 1fr; } .sources { grid-template-columns: 1fr; } }
    @media (max-width: 460px) { main { width: min(100% - 20px, 1180px); padding-top: 24px; } .grid { grid-template-columns: 1fr; } .metric { min-height: 0; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <p class="eyebrow">readme-forge comparison</p>
        <h1>${escapeHtml(options.facts.name)}</h1>
        <p class="muted">${escapeHtml(readmePath)} evaluated with the ${escapeHtml(profile)} quality profile.</p>
      </div>
      <div class="meta">
        <span class="tag">${escapeHtml(options.facts.packageManager)}</span>
        ${(detected.length ? detected : ["project metadata"]).map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("\n        ")}
      </div>
    </header>

    <div class="grid" aria-label="README comparison summary">
      <div class="metric"><span>Current score</span><strong>${existingQuality.percentage}%</strong><small>${qualityLabel(existingQuality)}</small></div>
      <div class="metric after"><span>Generated score</span><strong>${generatedQuality.percentage}%</strong><small>${qualityLabel(generatedQuality)}</small></div>
      <div class="metric"><span>Quality change</span><strong class="${improvement >= 0 ? "positive" : ""}">${improvement >= 0 ? "+" : ""}${improvement}</strong><small>percentage points</small></div>
      <div class="metric"><span>Line changes</span><strong>${summary.additions + summary.removals}</strong><small><span class="positive">+${summary.additions}</span> / <span style="color: var(--red)">-${summary.removals}</span></small></div>
    </div>

    <section>
      <h2>Quality checks</h2>
      <table>
        <thead><tr><th>Check</th><th>Current</th><th>Generated</th></tr></thead>
        <tbody>${renderChecks(existingQuality, generatedQuality)}</tbody>
      </table>
    </section>

    <section>
      <h2>Focused line diff</h2>
      <div class="diff-wrap">
        <table class="diff" aria-label="README line changes">
          <thead><tr><th>Old</th><th>New</th><th></th><th>Content</th></tr></thead>
          <tbody>${diffRows || '<tr><td></td><td></td><td></td><td>No README content.</td></tr>'}</tbody>
        </table>
      </div>
    </section>

    <section>
      <details>
        <summary>Inspect complete README sources</summary>
        <div class="sources">
          <div class="source"><h3>Current README</h3><pre>${escapeHtml(options.existing) || "No README found."}</pre></div>
          <div class="source"><h3>Generated README</h3><pre>${escapeHtml(options.generated)}</pre></div>
        </div>
      </details>
    </section>

    <footer>Generated locally by readme-forge. No project data was uploaded.</footer>
  </main>
</body>
</html>
`;
}
