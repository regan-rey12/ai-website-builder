function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function darkenColor(hex, amount = 0.15) {
  const { r, g, b } = hexToRgb(hex);
  const factor = 1 - amount;
  return rgbToHex(r * factor, g * factor, b * factor);
}

export function lightenColor(hex, amount = 0.85) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  );
}

export function getThemeVariables(primaryColor) {
  return {
    '--primary-color': primaryColor,
    '--primary-hover': darkenColor(primaryColor, 0.12),
    '--primary-soft': lightenColor(primaryColor, 0.92),
    '--secondary-color': darkenColor(primaryColor, 0.25),
    '--text-color': '#0f172a',
    '--background-color': '#ffffff',
  };
}
