const fs = require('fs');
const path = require('path');
const filePath = path.join('c:', 'wamp64', 'www', 'pulse', 'pulse-thread', 'app', 'chat.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import styles and useSafeAreaInsets
content = content.replace('import { SafeAreaView } from "react-native-safe-area-context";', 'import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";');
if (!content.includes('./chat.styles')) {
    content = content.replace('import { FlashList } from "@shopify/flash-list";', 'import { FlashList } from "@shopify/flash-list";\nimport { styles } from "./chat.styles";');
}

// 2. Add insets
if (!content.includes('useSafeAreaInsets()')) {
    content = content.replace('const typingUsers = typingState[channelId as string] ? Array.from(typingState[channelId as string]) : [];', 'const typingUsers = typingState[channelId as string] ? Array.from(typingState[channelId as string]) : [];\n  const insets = useSafeAreaInsets();');
}

// 3. Fix KeyboardAvoidingView offset
content = content.replace(/keyboardVerticalOffset=\{Platform\.OS === 'ios' \? 90 : 0\}/g, 'keyboardVerticalOffset={Platform.OS === "ios" ? 90 + insets.top : 0}');

// 4. Remove styles object
const stylesIndex = content.indexOf('const styles = StyleSheet.create({');
if (stylesIndex !== -1) {
    content = content.substring(0, stylesIndex);
}

fs.writeFileSync(filePath, content);
console.log("Successfully modified chat.tsx");
