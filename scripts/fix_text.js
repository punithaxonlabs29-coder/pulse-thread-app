const fs = require('fs');
const filesToFix = [
  'app/(auth)/login.tsx',
  'app/chat.tsx',
  'components/MessageInput.tsx',
  'components/ReactionPicker.tsx',
  'components/SelectionHeader.tsx',
  'components/ThreadCard.tsx',
  'components/VideoAttachment.tsx',
  'components/themed-text.tsx',
  'components/ui/DownloadButton.tsx'
];

filesToFix.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Add import if needed
  if (content.includes('<Text')) {
    const depth = file.split('/').length - 1;
    const prefix = depth === 0 ? './components/ui' : depth === 1 ? '../components/ui' : '../../components/ui';
    content = `import { AppText } from "${prefix}/AppText";\n` + content;
  }
  // Replace JSX
  content = content.replace(/<Text\b/g, '<AppText');
  content = content.replace(/<\/Text>/g, '</AppText>');
  // Remove react-native Text imports
  content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-native['"];/g, (match, p1) => {
    const parts = p1.split(',').map(s => s.trim()).filter(s => s !== 'Text' && s !== 'TextInput' && s !== '');
    if (parts.length === 0) return '';
    return `import { ${parts.join(', ')} } from "react-native";`;
  });
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed ' + file);
});
