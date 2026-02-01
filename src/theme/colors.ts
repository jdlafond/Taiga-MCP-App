/**
 * Blue & purple theme for Run Agent / chat UI.
 */
export const Theme = {
  // Primary palette
  primary: '#6366F1',       // Indigo-500
  primaryDark: '#4F46E5',  // Indigo-600
  purple: '#8B5CF6',       // Violet-500
  purpleDark: '#7C3AED',  // Violet-600

  // Backgrounds
  screenBg: '#0F0E17',     // Deep blue-black
  surface: '#1A1926',
  surfaceElevated: '#252336',
  chatBubbleUser: '#6366F1',
  chatBubbleUserAlt: '#8B5CF6',
  chatBubbleAgent: '#252336',
  inputBg: '#1A1926',

  // Text
  textPrimary: '#F3F2F9',
  textSecondary: '#A5A3C4',
  textMuted: '#6B6892',

  // Accents
  accentBlue: '#60A5FA',
  accentPurple: '#C4B5FD',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',

  // Borders
  border: '#2D2B42',
  borderFocus: '#6366F1',
} as const;
