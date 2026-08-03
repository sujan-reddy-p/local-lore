import { agentConfig } from "@/lib/agent/config";
import { categories, type Category, type MissionFormat, type MissionTrait } from "@/lib/types";

export type EditorialProposal = {
  title?: string;
  kicker?: string;
  description?: string;
  why?: string;
  category?: Category;
  format?: MissionFormat;
  traits?: MissionTrait[];
  useful: boolean;
  confidence: number;
};

const allowedFormats: MissionFormat[] = ["Adventure", "Class", "Culture", "Food", "Live", "Market", "Meetup", "Volunteer"];
const allowedTraits: MissionTrait[] = ["dog-friendly", "photogenic", "date-idea", "family", "weird", "cozy", "scenic", "drive", "romantic", "social"];

function shortText(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, max) : undefined;
}

export function validateEditorialProposal(value: unknown): EditorialProposal | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (typeof input.useful !== "boolean" || typeof input.confidence !== "number") return null;
  const category = categories.includes(input.category as Category) ? input.category as Category : undefined;
  const format = allowedFormats.includes(input.format as MissionFormat) ? input.format as MissionFormat : undefined;
  const traits = Array.isArray(input.traits) ? input.traits.filter((trait): trait is MissionTrait => allowedTraits.includes(trait as MissionTrait)).slice(0, 5) : undefined;
  return {
    useful: input.useful,
    confidence: Math.max(0, Math.min(1, input.confidence)),
    title: shortText(input.title, 90),
    kicker: shortText(input.kicker, 140),
    description: shortText(input.description, 380),
    why: shortText(input.why, 280),
    category,
    format,
    traits,
  };
}

export async function proposeEditorialCopy(facts: Record<string, unknown>): Promise<EditorialProposal | null> {
  const { apiKey, model } = agentConfig();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: "system", content: "You classify city activities. Use only supplied facts. Never invent dates, prices, locations, accessibility, organizers, URLs, images, or availability. Return compact JSON only with useful, confidence, title, kicker, description, why, category, format, traits." },
        { role: "user", content: JSON.stringify(facts) },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return null;
  const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return validateEditorialProposal(JSON.parse(content.replace(/^```json\s*|\s*```$/g, "")));
  } catch {
    return null;
  }
}
