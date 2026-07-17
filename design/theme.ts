import { Colors } from './colors';

// Currently returning light theme by default. 
// When Dark Mode is implemented, this will consume a ThemeProvider context.
export const useColors = () => {
  return Colors.light;
};
