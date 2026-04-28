const DEFAULT_FORBIDDEN_PATHS = [".env*", "secrets/**"];

const REPO_ALIASES = [
  { repo: "agentic-oss-template", patterns: [/agentic[- ]oss[- ]template/i, /agentic template/i] },
  { repo: "branchbrief", patterns: [/branchbrief/i, /branch brief/i] },
  { repo: "CrewCMD", patterns: [/crewcmd/i, /crew cmd/i] },
  { repo: "product-videogen", patterns: [/product[- ]videogen/i, /video ?gen/i] },
  { repo: "roger-website", patterns: [/roger[- ]website/i, /\bblog\b/i, /\bwebsite\b/i] },
  { repo: "taskbrief", patterns: [/taskbrief/i, /task brief/i] },
];

const TYPE_RULES = [
  { type: "release", patterns: [/npm/i, /publish/i, /release/i, /package metadata/i, /version/i] },
  { type: "deploy", patterns: [/deploy/i, /deployment/i, /cloudflare/i] },
  { type: "ci", patterns: [/ci\b/i, /github actions/i, /workflow/i, /dependabot/i] },
  { type: "review", patterns: [/\bpr\b/i, /pull request/i, /review/i] },
  { type: "qa", patterns: [/mobile/i, /iphone/i, /tablet/i, /qa/i, /test/i, /smoke/i] },
  { type: "docs", patterns: [/docs?/i, /readme/i, /blog/i, /changelog/i, /roadmap/i, /write/i] },
];

const HIGH_RISK = [
  /production data/i,
  /payments?/i,
  /stripe/i,
  /billing/i,
  /\bauth\b/i,
  /security/i,
  /migrations?/i,
  /secrets?/i,
  /environment variables?/i,
  /destructive/i,
  /data deletion/i,
  /public api/i,
  /customer data/i,
  /credentials?/i,
  /webhooks?/i,
  /tokens?/i,
];

const MEDIUM_RISK = [
  /release/i,
  /npm/i,
  /publish/i,
  /\bci\b/i,
  /deployment?/i,
  /deploy/i,
  /dependency|dependencies/i,
  /dependabot/i,
  /\bconfig\b/i,
  /mobile/i,
  /database sync/i,
  /public cli/i,
  /github actions/i,
  /cloudflare/i,
  /package metadata/i,
  /versioning/i,
];

const LOW_RISK = [
  /docs?/i,
  /readme/i,
  /examples?/i,
  /tests?/i,
  /issue templates?/i,
  /changelog/i,
  /roadmap/i,
  /blog/i,
  /copy/i,
];

export function normalizeTask(rawTask, index = 0) {
  const text = cleanSentence(rawTask.text ?? String(rawTask));
  const repo = rawTask.repo ?? inferRepo(text);
  const type = rawTask.type ?? inferType(text);
  const title = rawTask.title ?? titleFromText(text, repo, type);
  const risk = rawTask.risk ?? classifyRisk(text, type);
  const objective = rawTask.objective ?? objectiveFromText(text, repo, type);
  const slug = slugify(title || `${type} task ${index + 1}`);
  const idRepo = slugify(repo === "unknown" ? "unknown-repo" : repo);
  const id = rawTask.id ?? `${idRepo}-${slug}`;
  const branch = rawTask.branch ?? `agent/${slug}`;
  const allowedPaths = rawTask.allowed_paths ?? allowedPathsFor(type, text);
  const forbiddenPaths = rawTask.forbidden_paths ?? forbiddenPathsFor(type, text);
  const verification = rawTask.verification ?? verificationFor(type, text);
  const stopConditions = rawTask.stop_conditions ?? stopConditionsFor(risk, type, repo);
  const expectedCommits = rawTask.expected_commits ?? expectedCommitsFor(type, title);
  const humanDecisionNeeded = rawTask.human_decision_needed ?? humanDecisionsFor(risk, type, repo);

  return {
    id,
    title,
    repo,
    branch,
    type,
    risk,
    objective,
    context: rawTask.context ?? text,
    allowed_paths: allowedPaths,
    forbidden_paths: forbiddenPaths,
    verification,
    stop_conditions: stopConditions,
    expected_commits: expectedCommits,
    review_pack_required: rawTask.review_pack_required ?? true,
    human_decision_needed: humanDecisionNeeded,
    agent_prompt: rawTask.agent_prompt ?? buildAgentPrompt({ repo, title, objective, risk }),
  };
}

export function inferRepo(text) {
  const match = REPO_ALIASES.find((entry) => entry.patterns.some((pattern) => pattern.test(text)));
  return match?.repo ?? "unknown";
}

export function inferType(text) {
  const match = TYPE_RULES.find((entry) => entry.patterns.some((pattern) => pattern.test(text)));
  return match?.type ?? "task";
}

export function classifyRisk(text, type = inferType(text)) {
  if (HIGH_RISK.some((pattern) => pattern.test(text))) return "high";
  if (MEDIUM_RISK.some((pattern) => pattern.test(text))) return "medium";
  if (LOW_RISK.some((pattern) => pattern.test(text)) || ["docs", "qa"].includes(type)) return "low";
  return "medium";
}

export function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/['"]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 72);
}

function cleanSentence(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/^[,.;:\-\s]+|[,.;:\-\s]+$/g, "")
    .trim();
}

function titleFromText(text, repo, type) {
  const lower = text.toLowerCase();
  if (repo === "branchbrief" && /npm|release|publish/.test(lower)) return "Prepare branchbrief for npm release";
  if (repo === "branchbrief" && /docs?|deploy/.test(lower)) return "Verify branchbrief docs deploy";
  if (repo === "agentic-oss-template" && /dependabot/.test(lower)) return "Set up Dependabot";
  if (repo === "CrewCMD" && /\bpr\b|pull request|review/.test(lower)) return "Review CrewCMD PRs";
  if (repo === "product-videogen" && /mobile|iphone|tablet/.test(lower)) return "Run mobile QA";
  if (repo === "roger-website" && /blog/.test(lower)) return "Draft workflow blog post";
  if (type === "docs") return titleCase(text.replace(/^write\s+/i, "").slice(0, 80));
  return titleCase(text.slice(0, 80));
}

function objectiveFromText(text, repo, type) {
  if (repo === "unknown") return `Clarify ownership and complete task: ${sentenceCase(text)}.`;
  if (repo === "branchbrief" && type === "release") {
    return "Prepare branchbrief for npm release readiness without publishing.";
  }
  if (repo === "branchbrief" && type === "deploy") {
    return "Verify the branchbrief documentation deployment path and capture any required fixes.";
  }
  if (repo === "agentic-oss-template" && /dependabot/i.test(text)) {
    return "Add or verify Dependabot setup for agentic-oss-template.";
  }
  if (repo === "CrewCMD" && type === "review") {
    return "Review open CrewCMD pull requests and produce a bounded review pass.";
  }
  if (repo === "product-videogen" && type === "qa") {
    return "Create and run mobile QA checks for iPhone and tablet workflows.";
  }
  if (repo === "roger-website" && type === "docs") {
    return "Draft a blog post about turning brain dumps into task queues.";
  }
  return sentenceCase(text.endsWith(".") ? text : `${text}.`);
}

function allowedPathsFor(type, text) {
  if (/dependabot/i.test(text)) return [".github/dependabot.yml", "docs/**"];
  if (type === "release") return ["package.json", "README.md", "docs/**", "CHANGELOG.md"];
  if (type === "deploy" || type === "ci") return [".github/workflows/**", "docs/**", "README.md"];
  if (type === "qa") return ["tests/**", "docs/**"];
  if (type === "docs") return ["README.md", "docs/**", "examples/**"];
  if (type === "review") return ["docs/**", "tests/**", "src/**"];
  return ["docs/**", "src/**", "tests/**"];
}

function forbiddenPathsFor(type, text) {
  const paths = new Set(DEFAULT_FORBIDDEN_PATHS);
  if (/production|billing|auth/i.test(text) || type === "qa") {
    paths.add("billing/**");
    paths.add("auth/**");
    paths.add("production/**");
  }
  if (type === "release") paths.add("dist/**");
  return [...paths];
}

function verificationFor(type, text) {
  if (/iphone|tablet|mobile/i.test(text)) return ["manual iPhone smoke test", "manual tablet smoke test"];
  if (type === "release") return ["npm test", "npm run build", "npm pack --dry-run"];
  if (type === "deploy") return ["npm run build", "manual docs deploy review"];
  if (type === "ci") return ["npm test", "npm run build"];
  if (type === "docs") return ["manual documentation review"];
  if (type === "review") return ["manual PR review checklist"];
  return ["manual review"];
}

function stopConditionsFor(risk, type, repo) {
  const stops = new Set(["secrets or credentials required", "unclear target branch"]);
  if (repo === "unknown") stops.add("unclear repo ownership");
  if (risk === "high") {
    stops.add("production data mutation required");
    stops.add("payment/auth/security code touched");
  }
  if (type === "release") stops.add("package publishing requested");
  if (type === "deploy") stops.add("deployment credentials required");
  if (type === "qa") stops.add("production credentials required");
  return [...stops];
}

function expectedCommitsFor(type, title) {
  const scope = scopeFor(type);
  return [`${scope}: ${title.charAt(0).toLowerCase()}${title.slice(1)}`];
}

function scopeFor(type) {
  if (type === "docs") return "docs";
  if (type === "qa") return "test";
  if (type === "ci" || type === "deploy") return "ci";
  if (type === "release") return "chore(release)";
  if (type === "review") return "docs(review)";
  return "feat";
}

function humanDecisionsFor(risk, type, repo) {
  const decisions = [];
  if (repo === "unknown") decisions.push("confirm target repository");
  if (risk === "high") decisions.push("approve high-risk scope before implementation");
  if (risk === "medium") decisions.push("approve medium-risk implementation plan");
  if (type === "release") decisions.push("approve publish boundary");
  if (type === "deploy") decisions.push("approve deployment boundary");
  return decisions;
}

function buildAgentPrompt({ repo, title, objective, risk }) {
  return [
    `You are working on ${repo}.`,
    `Task: ${title}.`,
    `Objective: ${objective}`,
    `Risk level: ${risk}.`,
    "Keep changes scoped, verify the result, and return a review pack.",
  ].join("\n");
}

function sentenceCase(text) {
  const trimmed = cleanSentence(text);
  return trimmed ? `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}` : trimmed;
}

function titleCase(text) {
  return cleanSentence(text)
    .split(" ")
    .map((word) => (word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}
