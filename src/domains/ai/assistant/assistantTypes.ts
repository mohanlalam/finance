import { formatINR } from '../../../utils/formatters';

export interface ActionChip {
  label: string;
  tab: string;
}

export interface AssistantResponse {
  answer: string;
  matchedAssets: { name: string; type: string; details: string }[];
  toolsUsed?: { toolName: string; description: string; summary: string }[];
  actionChips?: ActionChip[];
  verdictHeadline?: string;
}

export function formatGainINR(value: number): string {
  return value >= 0 ? `+${formatINR(value)}` : formatINR(value);
}
