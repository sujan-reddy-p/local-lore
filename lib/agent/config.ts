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
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}
