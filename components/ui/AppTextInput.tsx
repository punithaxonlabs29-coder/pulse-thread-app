import React, { forwardRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';

export interface AppTextInputProps extends TextInputProps {
  maxFontSizeMultiplier?: number;
}

export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(
  ({ maxFontSizeMultiplier = 1.4, ...props }, ref) => (
    <TextInput 
      ref={ref} 
      allowFontScaling={true}
      maxFontSizeMultiplier={maxFontSizeMultiplier} 
      {...props} 
    />
  )
);
