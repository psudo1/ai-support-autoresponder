import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Calculate the cost of an OpenAI API call based on model and tokens
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Pricing per 1M tokens (as of 2024, update as needed)
  const pricing: Record<string, { prompt: number; completion: number }> = {
    'gpt-4': { prompt: 30.0, completion: 60.0 },
    'gpt-4-turbo': { prompt: 10.0, completion: 30.0 },
    'gpt-4o': { prompt: 5.0, completion: 15.0 },
    'gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },
  };

  const modelKey = model.toLowerCase();
  const prices = pricing[modelKey] || pricing['gpt-3.5-turbo'];

  const promptCost = (promptTokens / 1_000_000) * prices.prompt;
  const completionCost = (completionTokens / 1_000_000) * prices.completion;

  return promptCost + completionCost;
}

/**
 * Get default model based on environment or settings
 */
export function getDefaultModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o';
}

