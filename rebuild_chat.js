const fs = require('fs');
const filePath = 'c:/wamp64/www/pulse/pulse-thread/app/chat.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// =============================================
// 1. Fix imports - add FlashList, useSafeAreaInsets
// =============================================
content = content.replace(
  'import { ActivityIndicator, Alert, FlatList, Image, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, ToastAndroid, TouchableOpacity, View, Modal, Share } from "react-native";',
  'import { ActivityIndicator, Alert, Image, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, ToastAndroid, TouchableOpacity, View, Modal, Share } from "react-native";'
);
content = content.replace(
  'import { SafeAreaView } from "react-native-safe-area-context";',
  'import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";\nimport { FlashList } from "@shopify/flash-list";'
);
content = content.replace(
  'import { useChatContext }',
  'import { styles } from "./_chat.styles";\nimport { useChatContext }'
);

// =============================================
// 2. Fix state - replace displayLimit with loadingMore/hasMore, add insets
// =============================================
content = content.replace(
  "const flatListRef = useRef<FlatList>(null);",
  "const flatListRef = useRef<FlashList<any>>(null);"
);
content = content.replace(
  "const [displayLimit, setDisplayLimit] = useState(30);",
  "const [loadingMore, setLoadingMore] = useState(false);\n  const [hasMore, setHasMore] = useState(true);"
);
content = content.replace(
  "const typingUsers = typingState[channelId as string] ? Array.from(typingState[channelId as string]) : [];",
  "const typingUsers = typingState[channelId as string] ? Array.from(typingState[channelId as string]) : [];\n  const insets = useSafeAreaInsets();"
);

// =============================================
// 3. Replace handleLoadMore function (brace-counted)
// =============================================
const fnStart = '  const handleLoadMore = () => {';
const fnStartIdx = content.indexOf(fnStart);
if (fnStartIdx !== -1) {
  let braceCount = 0;
  let endIdx = fnStartIdx;
  let started = false;
  for (let i = fnStartIdx; i < content.length; i++) {
    if (content[i] === '{') { braceCount++; started = true; }
    if (content[i] === '}') { braceCount--; }
    if (started && braceCount === 0) { endIdx = i + 2; break; }
  }
  const newFn = `  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const olderMessages = await ConnectsService.getMessages(channelId as string, undefined, oldestMessage.created_at, 30);
      if (olderMessages.length > 0) {
        setMessages(prev => {
          const messageMap = new Map<string, Message>();
          olderMessages.forEach(m => messageMap.set(m.message_id, m));
          prev.forEach(m => messageMap.set(m.message_id, m));
          return Array.from(messageMap.values()).sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }
      if (olderMessages.length < 30) setHasMore(false);
    } catch (error) {
      console.log('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };\n`;
  content = content.substring(0, fnStartIdx) + newFn + content.substring(endIdx);
}

// =============================================
// 4. Fix displayData - remove slice
// =============================================
content = content.replace(
  'const displayData = [...messages].reverse().slice(0, displayLimit);',
  'const displayData = [...messages].reverse();'
);

// =============================================
// 5. Fix scrollToMessage - remove displayLimit check
// =============================================
content = content.replace(
  /if \(index >= displayLimit\) \{[^}]+setDisplayLimit[^}]+\}\s*setTimeout[^}]+\}\s*, 500[^}]+\}\s*\} else \{/g,
  'if (false) {\n      } else {'
);

// =============================================
// 6. Fix keyboardVerticalOffset to use insets
// =============================================
content = content.replace(
  "keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}",
  'keyboardVerticalOffset={Platform.OS === "ios" ? 90 + insets.top : 0}'
);

// =============================================
// 7. Replace FlatList JSX with FlashList
// =============================================
// Find the FlatList JSX block
const flatListJSXStart = content.indexOf('<FlatList');
const flatListJSXClose = '</FlatList>';
const flatListJSXCloseIdx = content.indexOf(flatListJSXClose);
if (flatListJSXStart !== -1 && flatListJSXCloseIdx !== -1) {
  const before = content.substring(0, flatListJSXStart);
  const after = content.substring(flatListJSXCloseIdx + flatListJSXClose.length);
  const newList = `<FlashList
                estimatedItemSize={80}
                ref={flatListRef}
                inverted={true}
                data={displayData}
                extraData={{ receipts: readReceipts[channelId as string], visibleItems }}
                keyExtractor={(item, index) => item.message_id + index}
                onViewableItemsChanged={onViewableItemsChanged.current}
                viewabilityConfig={viewabilityConfig.current}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                ListFooterComponent={
                  hasMore && loadingMore ? (
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                      <View style={{
                        backgroundColor: '#FFFFFF',
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        justifyContent: 'center',
                        alignItems: 'center',
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 2,
                      }}>
                        <ActivityIndicator size="small" color="#00A884" />
                      </View>
                    </View>
                  ) : null
                }
                onScrollToIndexFailed={(info) => {
                  const wait = new Promise(resolve => setTimeout(resolve, 500));
                  wait.then(() => {
                    flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                  });
                }}
                renderItem={({ item, index }) => {
                  const isMine = item.sender_email === currentUserEmail;
                  const lastReadMessageId = readReceipts[channelId as string];
                  const isRead = lastReadMessageId
                    ? messages.findIndex(m => m.message_id === lastReadMessageId) >= index
                    : false;
                  const currentDateStr = formatDateHeader(item.created_at);
                  const olderDateStr = displayData[index + 1] ? formatDateHeader(displayData[index + 1].created_at) : null;
                  const showDateHeader = currentDateStr !== olderDateStr;
                  const isFirstInGroup = displayData[index + 1]?.sender_email !== item.sender_email;
                  const showTail = showDateHeader || isFirstInGroup;
                  return (
                    <View>
                      {showDateHeader && (
                        <View style={styles.dateHeaderContainer}>
                          <View style={styles.dateHeaderPill}>
                            <Text style={styles.dateHeaderText}>{currentDateStr}</Text>
                          </View>
                        </View>
                      )}
                      <MessageBubble
                        messageId={item.message_id}
                        text={item.text}
                        attachments={item.attachments || []}
                        time={formatTimeOnly(item.created_at)}
                        isMine={isMine}
                        showTail={showTail}
                        readStatus={isMine ? (isRead ? "read" : "delivered") : undefined}
                        isVisible={visibleItems.has(item.message_id)}
                        reactions={item.reactions}
                        replyTo={item.reply_to}
                        isForwarded={item.is_forwarded}
                        isDeleted={item.is_deleted}
                        onSwipeReply={() => setReplyingTo(item)}
                        onReplyPress={(replyMessageId) => { scrollToMessage(replyMessageId); }}
                        selected={selectedMessageIds.includes(item.message_id)}
                        onLongPress={(y, height) => {
                          setSelectedMessageIds(prev => {
                            if (prev.includes(item.message_id)) return prev;
                            const next = [...prev, item.message_id];
                            if (next.length === 1) {
                              setReactionMenuPosition({ y, height });
                              setReactionModalVisible(true);
                            } else {
                              setReactionModalVisible(false);
                            }
                            return next;
                          });
                        }}
                        onReactionPress={(emoji) => handleReactionToggle(item.message_id, emoji)}
                      />
                    </View>
                  );
                }}
                contentContainerStyle={[styles.listContent, { paddingBottom: 16 }]}
              /></FlashList_SENTINEL`;
  content = before + newList + after;
  // clean up sentinel
  content = content.replace('/FlashList_SENTINEL', '');
}

// =============================================
// 8. Remove the old StyleSheet block
// =============================================
const stylesIdx = content.indexOf('const styles = StyleSheet.create(');
if (stylesIdx !== -1) {
  content = content.substring(0, stylesIdx);
}

fs.writeFileSync(filePath, content);
console.log('chat.tsx fully rebuilt');
