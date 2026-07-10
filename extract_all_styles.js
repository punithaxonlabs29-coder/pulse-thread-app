const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && !file.startsWith('.')) {
                processDirectory(fullPath);
            }
        } else if (fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find the StyleSheet.create block
    // We use a regex that matches const styles = StyleSheet.create({ ... });
    // This is tricky with regex because of nested braces, so we do a manual parse
    const searchString = 'const styles = StyleSheet.create(';
    const startIndex = content.indexOf(searchString);
    
    if (startIndex === -1) return; // No styles found
    
    let braceCount = 0;
    let endIndex = -1;
    
    // Start tracking braces from the first '{' inside the create(...)
    const firstBraceIndex = content.indexOf('{', startIndex);
    if (firstBraceIndex === -1) return;
    
    for (let i = firstBraceIndex; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        
        if (braceCount === 0) {
            // Find the closing parenthesis and semicolon
            let j = i + 1;
            while (j < content.length && (content[j] === ')' || content[j] === ';' || content[j] === ' ' || content[j] === '\n' || content[j] === '\r')) {
                j++;
            }
            endIndex = j;
            break;
        }
    }
    
    if (endIndex === -1) return; // Failed to parse
    
    const styleBlock = content.substring(startIndex, endIndex);
    
    // Verify it's actually valid before removing
    if (!styleBlock.includes('StyleSheet.create')) return;
    
    // Create the styles.ts content
    const styleFileContent = `import { StyleSheet } from 'react-native';\n\nexport ${styleBlock.trim()}`;
    
    // Write to styles file
    const parsedPath = path.parse(filePath);
    const styleFilePath = path.join(parsedPath.dir, `${parsedPath.name}.styles.ts`);
    
    // Don't overwrite if it already exists and has styles
    if (fs.existsSync(styleFilePath)) {
        return;
    }
    
    fs.writeFileSync(styleFilePath, styleFileContent);
    
    // Modify the original file
    let newContent = content.substring(0, startIndex) + content.substring(endIndex);
    
    // Add import statement at the top if not present
    const importStatement = `import { styles } from './${parsedPath.name}.styles';\n`;
    if (!newContent.includes(importStatement)) {
        // Find last import
        const lines = newContent.split('\n');
        let lastImportIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
                lastImportIndex = i;
            }
        }
        lines.splice(lastImportIndex + 1, 0, importStatement);
        newContent = lines.join('\n');
    }
    
    fs.writeFileSync(filePath, newContent);
    console.log(`Extracted styles for ${parsedPath.base} -> ${parsedPath.name}.styles.ts`);
}

const targetDirs = [
    path.join(__dirname, 'app'),
    path.join(__dirname, 'components')
];

for (const dir of targetDirs) {
    if (fs.existsSync(dir)) {
        processDirectory(dir);
    }
}

console.log("Finished extracting styles.");
