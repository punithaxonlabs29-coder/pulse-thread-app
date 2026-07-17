// Primitive color values (theme-agnostic)
const Primitives = {
  white: '#FFFFFF',
  black: '#000000',
  
  orange300: '#F8A871', // Soft orange for chat bubble
  orange500: '#F97316',
  orange600: '#FF8C00', // Reply icon circle
  
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB', // Borders
  gray400: '#9CA3AF',
  gray500: '#6B7280', // Text secondary
  gray600: '#71828A', // Forwarded text
  gray800: '#1F2937', 
  gray900: '#111827', // Text primary
  
  slate50: '#F8FAFC', // Background
  slate200: '#E2E8F0',
  slate800: '#1E293B',
  
  green500: '#22C55E', // Success/Unread
  red500: '#EF4444',   // Error/Delete
  blue500: '#3B82F6',  // Info

  
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.4)',
  selectedOverlay: 'rgba(0,0,0,0.08)',
} as const;

// Semantic tokens by theme
export const Colors = {
  light: {
    background: {
      primary: Primitives.slate50,
      surface: Primitives.white,
      overlay: Primitives.overlay,
      selected: Primitives.selectedOverlay,
    },
    text: {
      primary: Primitives.gray900,
      secondary: Primitives.gray500,
      muted: Primitives.gray400,
      inverse: Primitives.white,
      brand: Primitives.orange500,
      success: Primitives.green500,
    },
    border: {
      primary: Primitives.gray200,
      brand: Primitives.orange500,
    },
    brand: {
      primary: Primitives.orange500,
      primaryLight: 'rgba(249, 115, 22, 0.12)', // Used for selected row
      bubble: Primitives.orange300,
      accent: Primitives.orange600,
    },
    bubble: {
      own: {
        background: Primitives.orange300,
        text: Primitives.gray900,
      },
      other: {
        background: Primitives.white,
        text: Primitives.gray900,
      }
    },
    status: {
      success: Primitives.green500,
      error: Primitives.red500,
      info: Primitives.blue500,
    }
  },
  dark: {
    // Placeholder for future implementation
    background: {
      primary: Primitives.gray900,
      surface: Primitives.gray800,
      overlay: Primitives.overlay,
    },
    text: {
      primary: Primitives.gray50,
      secondary: Primitives.gray200,
      inverse: Primitives.gray900,
      brand: Primitives.orange500,
      success: Primitives.green500,
    },
    border: {
      primary: Primitives.gray800,
      brand: Primitives.orange500,
    },
    brand: {
      primary: Primitives.orange500,
      primaryLight: 'rgba(249, 115, 22, 0.2)', 
    },
    status: {
      success: Primitives.green500,
      error: Primitives.red500,
      info: Primitives.blue500,
    }
  }
} as const;
