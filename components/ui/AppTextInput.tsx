import React, { forwardRef } from 'react';
import { TextInput, TextInputProps, useWindowDimensions } from 'react-native';

export interface AppTextInputProps extends TextInputProps {
  maxFontSizeMultiplier?: number;
}

export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(
  ({ maxFontSizeMultiplier = 1.4, ...props }, ref) => {
    // We call useWindowDimensions so that this component automatically re-renders
    // when the Android system fontScale changes, forcing the native TextInput to update!
    useWindowDimensions();

    return (
      <TextInput 
        ref={ref} 
        allowFontScaling={true}
        maxFontSizeMultiplier={maxFontSizeMultiplier} 
        {...props} 
      />
    );
  }
);
