import React from 'react';
import { Text, TextProps, useWindowDimensions } from 'react-native';
import { Typography, TypographyVariant , useColors } from '../../design';


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
  // We call useWindowDimensions so that this component automatically re-renders
  // when the Android system fontScale changes, forcing the native Text to update!
  useWindowDimensions();
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
      maxFontSizeMultiplier={rest.maxFontSizeMultiplier !== undefined ? rest.maxFontSizeMultiplier : ('maxFontSizeMultiplier' in typoStyle ? typoStyle.maxFontSizeMultiplier : undefined)}
      allowFontScaling={'allowFontScaling' in typoStyle ? typoStyle.allowFontScaling : true}
      {...rest}
    >
      {children}
    </Text>
  );
};
