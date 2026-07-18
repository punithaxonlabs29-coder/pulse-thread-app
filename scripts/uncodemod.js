const fs = require('fs');
const files = [
  'app/(auth)/login.tsx',
  'app/(tabs)/index.tsx',
  'app/(tabs)/profile.tsx',
  'app/chat.tsx',
  'app/forward.tsx',
  'app/new-group.tsx',
  'components/Button/PrimaryButton.tsx',
  'components/Input/InputField.tsx',
  'components/MentionPicker.tsx',
  'components/MessageBubble/MessageText.tsx',
  'components/MessageBubble/ReactionBar.tsx',
  'components/MessageInput.tsx',
  'components/ReactionPicker.tsx',
  'components/SearchHeader.tsx',
  'components/themed-text.tsx',
  'components/ui/DownloadButton.tsx',
  'components/ui/icon-symbol.tsx',
  'components/VideoAttachment.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Revert JSX
  content = content.replace(/<AppText/g, '<Text');
  content = content.replace(/<\/AppText>/g, '</Text>');
  content = content.replace(/<AppTextInput/g, '<TextInput');
  content = content.replace(/<\/AppTextInput>/g, '</TextInput>');
  
  // Remove the AppText/AppTextInput imports added by codemod
  // My codemod added them as: import { AppText } from '.../AppText';
  const importLines = content.split('\n');
  const newLines = importLines.filter(line => !line.includes("from '") || (!line.includes("/AppText'") && !line.includes("/AppTextInput'")));
  content = newLines.join('\n');
  
  // Also we need to restore react-native imports if they were stripped?
  // Actually, I can just use git checkout for the ones I didn't touch in the previous session!
  fs.writeFileSync(file, content, 'utf8');
  console.log('Reverted JSX in ' + file);
});
