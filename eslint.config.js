// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text', 'TextInput'],
              message: 'Use AppText or AppTextInput from @/components/ui instead.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['components/ui/AppText.tsx', 'components/ui/AppTextInput.tsx'],
    rules: {
      'no-restricted-imports': 'off'
    }
  }
]);
