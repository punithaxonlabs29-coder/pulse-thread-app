const fs = require('fs');
const filePath = 'c:/wamp64/www/pulse/pulse-thread/app/chat.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find where the component ends: `}\n\n` after SafeAreaView closing
// The function body ends with `}\n` after the return statement
// Look for `}` followed by anything else that isn't imports or exports
const endMarker = '  );\n}\n';
const endIndex = content.indexOf(endMarker);
if (endIndex !== -1) {
    content = content.substring(0, endIndex + endMarker.length);
    // Also remove the StyleSheet import from react-native since it's now in the external file
    content = content.replace(', StyleSheet,', ',');
    content = content.replace(', StyleSheet ', ' ');
    content = content.replace(' StyleSheet,', '');
    fs.writeFileSync(filePath, content);
    console.log('Cleaned up chat.tsx, total lines:', content.split('\n').length);
} else {
    console.log('Marker not found');
}
