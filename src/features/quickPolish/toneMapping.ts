import { Tone } from '../../types';

export const QUICK_POLISH_TONE_MAP: Record<string, Tone> = {
  neutral: 'Professional',
  premium: 'Persuasive',
  friendly: 'Friendly',
  bold: 'Bold',
  formal: 'Professional',
};

export function mapQuickPolishTone(tone?: string): Tone {
  return tone ? (QUICK_POLISH_TONE_MAP[tone] ?? 'Professional') : 'Professional';
}
