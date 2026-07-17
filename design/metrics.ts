export const IconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export const Opacities = {
  none: 0,
  active: 0.7, // Used for activeOpacity in touchables
  disabled: 0.5,
  full: 1,
} as const;

export const ZIndices = {
  base: 0,
  stickyHeader: 10,
  actionBar: 20,
  imagePickerOverlay: 50,
  modal: 100,
  toast: 200,
} as const;
