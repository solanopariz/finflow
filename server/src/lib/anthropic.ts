import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';

/** Modelo de categorização: rápido e barato, via tool use para JSON confiável. */
export const CATEGORIZER_MODEL = 'claude-haiku-4-5';

let client: Anthropic | null = null;

/** A IA só está disponível quando a chave da Anthropic está configurada. */
export function isAiConfigured(): boolean {
  return env.ANTHROPIC_API_KEY.length > 0;
}

/** Cliente Anthropic (singleton). Lança se a chave não estiver configurada. */
export function getAnthropic(): Anthropic {
  if (!isAiConfigured()) {
    throw new Error('ANTHROPIC_API_KEY não configurada');
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}
