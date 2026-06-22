const palette = {
  primary: '#9b72cf',       // soft purple
  secondary: '#7ba7e0',     // soft blue
  accent: '#d982a8',        // soft pink
  success: '#74c49a',       // soft green
  warning: '#e8c96a',       // soft amber
  destructive: '#d97a7a',   // soft red

  // light
  background: '#f8f6ff',
  card: '#ffffff',
  border: '#dcd9ee',
  muted: '#f0eef8',
  mutedForeground: '#8b8aad',
  foreground: '#1a1a26',
  cardForeground: '#1a1a26',

  // dark
  backgroundDark: '#1a1a26',
  cardDark: '#21212f',
  borderDark: '#2e2e3d',
  mutedDark: '#252535',
  mutedForegroundDark: '#9494b8',
  foregroundDark: '#f0eef8',
  cardForegroundDark: '#f0eef8',

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export default palette;
export type ColorPalette = typeof palette;
