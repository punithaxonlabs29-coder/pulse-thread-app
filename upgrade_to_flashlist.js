const fs = require('fs');
const filePath = 'c:/wamp64/www/pulse/pulse-thread/app/chat.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove FlatList import and add FlashList import
content = content.replace('FlatList, ', '');
if (!content.includes('import { FlashList } from "@shopify/flash-list";')) {
    content = content.replace('import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";', 'import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";\nimport { FlashList } from "@shopify/flash-list";');
}

// 2. Change FlatList references to FlashList
content = content.replace(/useRef<FlatList>/g, 'useRef<FlashList>');
content = content.replace(/<FlatList/g, '<FlashList estimatedItemSize={70}');
content = content.replace(/<\/FlatList>/g, '</FlashList>');

// 3. Update Spinner styling
const oldSpinner = 'ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#F97316" style={{ marginVertical: 10 }} /> : null}';
const newSpinner = `ListFooterComponent={loadingMore ? (
                <View style={{ alignItems: 'center', marginVertical: 12 }}>
                  <View style={{ backgroundColor: '#FFFFFF', padding: 6, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 }}>
                    <ActivityIndicator size="small" color="#00A884" />
                  </View>
                </View>
              ) : null}`;
content = content.replace(oldSpinner, newSpinner);

fs.writeFileSync(filePath, content);
console.log('FlashList applied');
