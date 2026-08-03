export type AgentConfig = {
  model: string;
  apiKey: string;
};

export function agentConfig(): AgentConfig {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is required for the Local Lore agent.");
  return { apiKey, model: process.env.OPENROUTER_MODEL ?? "openrouter/free" };
}

export function validCronRequest(request: Request) {
  // `CRON_SECRET` is the value Vercel's scheduler sends as a Bearer token.
  // The project-specific mirror avoids a platform-reserved variable ambiguity
  // while preserving Vercel's standard cron behavior.
  const secret = process.env.LOCAL_LORE_CRON_SECRET ?? process.env.CRON_SECRET;
  if (!secret) return false;
  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}
