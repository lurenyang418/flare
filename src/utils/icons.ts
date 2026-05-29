import * as mdi from '@mdi/js';

// Build a case-insensitive lookup map from the full 7000+ MDI icon set
const iconMap: Record<string, string> = {};
for (const [key, path] of Object.entries(mdi)) {
  if (typeof path === 'string' && key.startsWith('mdi')) {
    const name = key.slice(3); // strip 'mdi' prefix
    iconMap[name] = path;
    iconMap[name.toLowerCase()] = path;
  }
}

export function getIconSVG(name: string, color?: string): string {
  const path = iconMap[name] ?? iconMap[name.toLowerCase()];
  if (!path) {
    return `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" style="fill: ${color || 'var(--color-primary)'}"></path></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="24" height="24"><path d="${path}" style="fill: ${color || 'var(--color-primary)'}"></path></svg>`;
}

export function hasIcon(name: string): boolean {
  return !!(iconMap[name] ?? iconMap[name.toLowerCase()]);
}
