const fs = require('fs');
const filePath = 'c:/wamp64/www/pulse/pulse-thread/app/chat.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add states
if (!content.includes('const [loadingMore')) {
    content = content.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n  const [loadingMore, setLoadingMore] = useState(false);\n  const [hasMore, setHasMore] = useState(true);');
}

// 2. Replace handleLoadMore
const oldHandleLoadMore = `  const handleLoadMore = () => {
    if (displayLimit < messages.length) {
      setDisplayLimit(prev => prev + 20);
    }
  };`;

const newHandleLoadMore = `  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    
    // First, if we still have local messages that aren't displayed, just show them
    if (displayLimit < messages.length) {
      setDisplayLimit(prev => prev + 30);
      return;
    }

    // Otherwise, fetch from API
    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const olderMessages = await ConnectsService.getMessages(channelId as string, undefined, oldestMessage.created_at, 30);
      
      if (olderMessages.length > 0) {
        setMessages(prev => {
          const messageMap = new Map<string, Message>();
          olderMessages.forEach(m => messageMap.set(m.message_id, m));
          prev.forEach(m => messageMap.set(m.message_id, m));
          const updated = Array.from(messageMap.values()).sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          CacheService.saveMessages(channelId as string, updated);
          return updated;
        });
        setDisplayLimit(prev => prev + olderMessages.length);
      }
      
      if (olderMessages.length < 30) {
        setHasMore(false);
      }
    } catch (error) {
      console.log('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };`;

content = content.replace(oldHandleLoadMore, newHandleLoadMore);

// 3. Add ListFooterComponent
if (!content.includes('ListFooterComponent=')) {
    content = content.replace('onEndReachedThreshold={0.5}', 'onEndReachedThreshold={0.5}\n              ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#F97316" style={{ marginVertical: 10 }} /> : null}');
}

fs.writeFileSync(filePath, content);
console.log("Updated chat.tsx");
