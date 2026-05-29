import type { Theme } from '../types/models';

export const THEME_PALETTES: Theme[] = [
  { name: 'blackboard', colors: { background: '#1a1a1a', primary: '#FFFDEA', accent: '#5c5c5c' } },
  { name: 'gazette',    colors: { background: '#F2F7FF', primary: '#000000', accent: '#5c5c5c' } },
  { name: 'espresso',   colors: { background: '#21211F', primary: '#D1B59A', accent: '#4E4E4E' } },
  { name: 'cab',        colors: { background: '#F6D305', primary: '#1F1F1F', accent: '#424242' } },
  { name: 'cloud',      colors: { background: '#f1f2f0', primary: '#35342f', accent: '#37bbe4' } },
  { name: 'lime',       colors: { background: '#263238', primary: '#AABBC3', accent: '#aeea00' } },
  { name: 'white',      colors: { background: '#ffffff', primary: '#222222', accent: '#dddddd' } },
  { name: 'tron',       colors: { background: '#242B33', primary: '#EFFBFF', accent: '#6EE2FF' } },
  { name: 'blues',      colors: { background: '#2B2C56', primary: '#EFF1FC', accent: '#6677EB' } },
  { name: 'passion',    colors: { background: '#f5f5f5', primary: '#12005e', accent: '#8e24aa' } },
  { name: 'chalk',      colors: { background: '#263238', primary: '#AABBC3', accent: '#FF869A' } },
  { name: 'paper',      colors: { background: '#F8F6F1', primary: '#4C432E', accent: '#AA9A73' } },
  { name: 'neon',       colors: { background: '#091833', primary: '#EFFBFF', accent: '#ea00d9' } },
  { name: 'pumpkin',    colors: { background: '#2d3436', primary: '#EFFBFF', accent: '#ffa500' } },
  { name: 'onedark',    colors: { background: '#282c34', primary: '#dfd9d6', accent: '#98c379' } },
];

export function getThemeByName(name: string): Theme | undefined {
  return THEME_PALETTES.find((t) => t.name === name);
}

export function getThemePrimaryColor(name: string): string {
  return getThemeByName(name)?.colors.primary ?? '#FFFDEA';
}

export function getThemeBodyStyle(name: string): string {
  const theme = getThemeByName(name);
  if (!theme) return '';
  return `--color-background:${theme.colors.background};--color-primary:${theme.colors.primary};--color-accent:${theme.colors.accent};`;
}
