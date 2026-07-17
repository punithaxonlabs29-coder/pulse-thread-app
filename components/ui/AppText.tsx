import React from 'react';
import { Text, TextProps } from 'react-native';
import { Typography, TypographyVariant } from '../../design';
import { useColors } from '../../design';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string; // Optional override, defaults to text.primary
}

export const AppText = ({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}: AppTextProps) => {
  const colors = useColors();
  const typoStyle = Typography[variant];

  return (
    <Text
      style={[
        {
          color: color || colors.text.primary,
          fontSize: typoStyle.fontSize,
          fontWeight: typoStyle.fontWeight as any,
          lineHeight: typoStyle.lineHeight,
        },
        style,
      ]}
      maxFontSizeMultiplier={'maxFontSizeMultiplier' in typoStyle ? typoStyle.maxFontSizeMultiplier : undefined}
      allowFontScaling={'allowFontScaling' in typoStyle ? typoStyle.allowFontScaling : true}
      {...rest}
    >
      {children}
    </Text>
  );
};
