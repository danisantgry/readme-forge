import type { ProjectFacts } from "./analyzer.js";

export type QualityIssue = {
  id: string;
  message: string;
};

export type QualityCheck = {
  id: string;
  message: string;
  passed: boolean;
};

export type ReadmeQualityReport = {
  score: number;
  maxScore: number;
  percentage: number;
  issues: QualityIssue[];
  passedChecks: string[];
  checks: QualityCheck[];
};

export function assessReadmeQuality(readme: string, facts: ProjectFacts): ReadmeQualityReport {
  const has = (pattern: RegExp) => pattern.test(readme);
  const checks: QualityCheck[] = [
    {
      id: "title",
      message: "README has a top-level title.",
      passed: has(/^#\s+\S+/m)
    },
    {
      id: "install",
      message: "README documents installation or getting started instructions.",
      passed: has(/##\s+(Install|Installation|Getting Started)/i)
    },
    {
      id: "scripts",
      message: "README documents available package scripts.",
      passed: !Object.keys(facts.scripts).length || has(/##\s+Scripts/i)
    },
    {
      id: "tests",
      message: "README documents how to run tests.",
      passed: !facts.scripts.test || has(/##\s+Test/i)
    },
    {
      id: "license",
      message: "README has a license section.",
      passed: has(/##\s+License/i)
    },
    {
      id: "contributing",
      message: "README points contributors to a contribution guide.",
      passed: facts.files.includes("CONTRIBUTING.md")
        ? has(/##\s+Contributing/i) || /CONTRIBUTING\.md/i.test(readme)
        : true
    },
    {
      id: "security",
      message: "README points security researchers to a security policy.",
      passed: facts.files.includes("SECURITY.md") ? has(/##\s+Security/i) || /SECURITY\.md/i.test(readme) : true
    }
  ];

  const issueMessages: Record<string, string> = {
    title: "README is missing a top-level title.",
    install: "README is missing installation or getting started instructions.",
    scripts: "Project has package scripts, but README does not document them.",
    tests: "Project has a test script, but README does not document testing.",
    license: "README is missing a license section.",
    contributing: "Project has CONTRIBUTING.md, but README does not link or mention it.",
    security: "Project has SECURITY.md, but README does not link or mention it."
  };

  const issues = checks
    .filter((check) => !check.passed)
    .map((check) => ({ id: `missing-${check.id}`, message: issueMessages[check.id] ?? check.message }));
  const score = checks.filter((check) => check.passed).length;
  const maxScore = checks.length;

  return {
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    issues,
    passedChecks: checks.filter((check) => check.passed).map((check) => check.id),
    checks
  };
}

export function checkReadmeQuality(readme: string, facts: ProjectFacts): QualityIssue[] {
  return assessReadmeQuality(readme, facts).issues;
}
