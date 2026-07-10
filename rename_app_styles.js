const fs = require('fs');
const path = require('path');

const appDir = 'c:/wamp64/www/pulse/pulse-thread/app';
const files = fs.readdirSync(appDir);

for (const file of files) {
    if (file.endsWith('.styles.ts') && !file.startsWith('_')) {
        const oldName = file;
        const newName = '_' + file;
        
        const oldPath = path.join(appDir, oldName);
        const newPath = path.join(appDir, newName);
        
        fs.renameSync(oldPath, newPath);
        
        // Find the corresponding .tsx file and update import
        const tsxName = file.replace('.styles.ts', '.tsx');
        const tsxPath = path.join(appDir, tsxName);
        
        if (fs.existsSync(tsxPath)) {
            let content = fs.readFileSync(tsxPath, 'utf8');
            // update the import statement
            const oldImport = `./${file.replace('.ts', '')}`;
            const newImport = `./${newName.replace('.ts', '')}`;
            
            content = content.replace(oldImport, newImport);
            fs.writeFileSync(tsxPath, content);
            console.log(`Updated ${tsxName} to import ${newImport}`);
        }
    }
}
console.log("Done");
