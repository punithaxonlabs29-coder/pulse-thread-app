const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = [...walk(path.join(process.cwd(), 'app')), ...walk(path.join(process.cwd(), 'components'))];

files.forEach(file => {
  if (file.endsWith('AppText.tsx') || file.endsWith('AppTextInput.tsx')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace imports
  const importRegex = /import\s+{[^}]*\b(Text|TextInput)\b[^}]*}\s+from\s+['"]react-native['"];/g;
  
  if (importRegex.test(content) || content.includes('<Text') || content.includes('</Text') || content.includes('<TextInput')) {
    // 1. Add AppText / AppTextInput imports if needed
    const needsAppText = content.includes('<Text') || content.includes('</Text>');
    const needsAppTextInput = content.includes('<TextInput') || content.includes('</TextInput');
    
    if (needsAppText || needsAppTextInput) {
      // Find relative path to components
      const relativePath = path.relative(path.dirname(file), path.join(process.cwd(), 'components')).replace(/\\/g, '/');
      const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      
      let newImports = [];
      if (needsAppText) newImports.push('AppText');
      if (needsAppTextInput) newImports.push('AppTextInput');
      
      const importStr = `import { ${newImports.join(', ')} } from '${importPath}/AppText${needsAppTextInput ? 'Input' : ''}'; // CODEMOD: Adjust if both are needed`;
      // Actually let's just import from the specific files
      const importLines = [];
      if (needsAppText) importLines.push(`import { AppText } from '${importPath === '.' ? '.' : importPath}/AppText';`);
      if (needsAppTextInput) importLines.push(`import { AppTextInput } from '${importPath === '.' ? '.' : importPath}/AppTextInput';`);
      
      // insert after first import or at top
      content = importLines.join('\n') + '\n' + content;
      
      // Replace JSX
      if (needsAppText) {
        content = content.replace(/<Text\b/g, '<AppText');
        content = content.replace(/<\/Text>/g, '</AppText>');
      }
      if (needsAppTextInput) {
        content = content.replace(/<TextInput\b/g, '<AppTextInput');
        content = content.replace(/<\/TextInput>/g, '</AppTextInput>');
      }
      
      // Remove Text/TextInput from react-native imports
      content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-native['"];/g, (match, p1) => {
        const parts = p1.split(',').map(s => s.trim()).filter(s => s !== 'Text' && s !== 'TextInput' && s !== '');
        if (parts.length === 0) return '';
        return `import { ${parts.join(', ')} } from 'react-native';`;
      });

      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
