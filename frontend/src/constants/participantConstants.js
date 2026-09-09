/**
 * Participant experience constants, color themes, and normalization helpers.
 */

export const EXPERIENCE_OPTIONS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Pro', label: 'Pro' },
];

export const EXP_COLORS = {
  Beginner: { text: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  Intermediate: { text: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  Advanced: { text: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  Professional: { text: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  Pro: { text: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

export const expStyle = (exp) => EXP_COLORS[exp] || EXP_COLORS.Beginner;

export const EXPERIENCE_MAP = {
  Beginner: 'Beginner',
  Intermediate: 'Intermediate',
  Advanced: 'Advanced',
  Pro: 'Professional',
  Professional: 'Professional',
};

export const normalizeExperience = (experience) => EXPERIENCE_MAP[experience] || 'Beginner';
