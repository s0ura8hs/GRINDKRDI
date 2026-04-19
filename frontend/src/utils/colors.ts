export const Colors = {
  appBg: '#f8fafc',
  surface: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textDim: '#94a3b8',
  border: '#e2e8f0',
  borderDark: '#0f172a',
  success: '#34d399',
  successDark: '#047857',
  successBg: '#ecfdf5',
  streak: '#fbbf24',
  streakBg: '#fef3c7',
  streakText: '#b45309',
  locked: '#f1f5f9',
  lockedText: '#94a3b8',
  danger: '#ef4444',
  dangerBg: '#fef2f2',
  tabActive: '#0f172a',
  tabInactive: '#94a3b8',
  timerBg: '#1e1b4b',
  timerText: '#e0e7ff',
};

// Dynamic stream color palette - assigned by index
const PALETTE = [
  { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' },
  { bg: '#d1fae5', text: '#047857', border: '#a7f3d0' },
  { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
  { bg: '#fce7f3', text: '#be185d', border: '#fbcfe8' },
  { bg: '#f3e8ff', text: '#7c3aed', border: '#ddd6fe' },
  { bg: '#ecfccb', text: '#4d7c0f', border: '#d9f99d' },
  { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3' },
  { bg: '#ccfbf1', text: '#0f766e', border: '#99f6e4' },
  { bg: '#fef9c3', text: '#854d0e', border: '#fef08a' },
];

const ICONS = [
  'zap', 'server', 'bar-chart-2', 'cloud', 'code',
  'compass', 'edit-3', 'globe', 'layers', 'package',
  'star', 'terminal', 'cpu', 'database', 'book-open',
];

export function getStreamColor(index: number) {
  return PALETTE[index % PALETTE.length];
}

export function getStreamIcon(index: number) {
  return ICONS[index % ICONS.length];
}
