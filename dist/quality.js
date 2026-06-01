export function checkReadmeQuality(readme, facts) {
    const issues = [];
    const has = (pattern) => pattern.test(readme);
    if (!has(/^#\s+\S+/m)) {
        issues.push({ id: "missing-title", message: "README is missing a top-level title." });
    }
    if (!has(/##\s+(Install|Installation|Getting Started)/i)) {
        issues.push({ id: "missing-install", message: "README is missing installation or getting started instructions." });
    }
    if (Object.keys(facts.scripts).length && !has(/##\s+Scripts/i)) {
        issues.push({ id: "missing-scripts", message: "Project has package scripts, but README does not document them." });
    }
    if (facts.scripts.test && !has(/##\s+Test/i)) {
        issues.push({ id: "missing-tests", message: "Project has a test script, but README does not document testing." });
    }
    if (!has(/##\s+License/i)) {
        issues.push({ id: "missing-license", message: "README is missing a license section." });
    }
    return issues;
}
