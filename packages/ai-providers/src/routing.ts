import type { Intent, GenerateOptions } from "./types";

type Region = GenerateOptions["region"];

interface RoutingRule {
  intentPrefix: string;
  cn: string;
  overseas: string;
}

const ROUTING_TABLE: RoutingRule[] = [
  { intentPrefix: "garment.", cn: "dashscope", overseas: "replicate" },
  { intentPrefix: "copy.", cn: "dashscope", overseas: "openai" },
  { intentPrefix: "video.", cn: "doubao-jimeng", overseas: "fal" },
  { intentPrefix: "size.", cn: "dashscope", overseas: "openai" },
  { intentPrefix: "edit.", cn: "dashscope", overseas: "replicate" },
];

/**
 * Resolves the provider name for a given intent and region.
 */
export function resolveProvider(intent: Intent, region: Region): string {
  for (const rule of ROUTING_TABLE) {
    if (intent.startsWith(rule.intentPrefix)) {
      return region === "CN" ? rule.cn : rule.overseas;
    }
  }
  throw new Error(`No provider configured for intent: ${intent}`);
}
