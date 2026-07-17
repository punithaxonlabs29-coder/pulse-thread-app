export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    maxFontSizeMultiplier: 1.2,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    maxFontSizeMultiplier: 1.2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    maxFontSizeMultiplier: 1.3,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    maxFontSizeMultiplier: 1.3,
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    maxFontSizeMultiplier: 1.3,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    maxFontSizeMultiplier: 1.4,
  },
  captionSemibold: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    maxFontSizeMultiplier: 1.4,
  },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    allowFontScaling: false, 
  }
} as const;

export type TypographyVariant = keyof typeof Typography;
