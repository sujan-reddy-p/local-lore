const UNRESERVED = /%([0-9a-f]{2})/gi;

function normalizeUnreserved(value) {
  return value.replace(UNRESERVED, (encoded, hex) => {
    const character = String.fromCharCode(Number.parseInt(hex, 16));
    return /^[A-Za-z0-9\-._~]$/.test(character) ? character : encoded.toUpperCase();
  });
}

function ruleMatches(rule, target) {
  const terminal = rule.endsWith("$");
  const body = terminal ? rule.slice(0, -1) : rule;
  const pattern = normalizeUnreserved(body).split("*").map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${pattern}${terminal ? "$" : ""}`).test(normalizeUnreserved(target));
}

function specificity(rule) {
  return [...rule.replace(/\*|\$$/g, "")].length;
}

/**
 * Evaluate robots.txt for a generic research reader, not source-license terms.
 * User-agent-specific groups are unsupported; only wildcard groups apply.
 */
export function robotsAllows(text, sourceUrl) {
  if (typeof text !== "string" || typeof sourceUrl !== "string") return false;
  let url;
  try {
    url = new URL(sourceUrl);
  } catch {
    return false;
  }

  const groups = [];
  let agents = [];
  let rules = [];
  let sawAgent = false;
  const flush = () => {
    if (agents.length) groups.push({ agents, rules });
    agents = [];
    rules = [];
  };

  for (let line of text.split(/\r?\n/)) {
    // Read tools may prefix extracted text with metadata rather than robots content.
    line = line.replace(/^\s*(?:\[robots\.txt[^\]]*\]|robots\.txt:\s*)/i, "");
    const comment = line.indexOf("#");
    if (comment >= 0) line = line.slice(0, comment);
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const name = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (name === "user-agent") {
      if (rules.length) flush();
      agents.push(value.toLowerCase());
      sawAgent = true;
    } else if ((name === "allow" || name === "disallow") && agents.length) {
      rules.push({ allow: name === "allow", path: value });
    }
  }
  flush();
  if (!sawAgent) return false;

  const applicable = groups.filter((group) => group.agents.includes("*"));
  if (!applicable.length) return true;
  const target = `${url.pathname}${url.search}`;
  let winner = null;
  for (const group of applicable) {
    for (const rule of group.rules) {
      if (!rule.path || !ruleMatches(rule.path, target)) continue;
      const length = specificity(rule.path);
      if (!winner || length > winner.length || (length === winner.length && rule.allow)) {
        winner = { allow: rule.allow, length };
      }
    }
  }
  return winner ? winner.allow : true;
}
