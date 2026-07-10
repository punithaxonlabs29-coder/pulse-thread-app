const fs = require('fs');
const filePath = 'c:/wamp64/www/pulse/pulse-thread/app/chat.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove useState for displayLimit
content = content.replace('const [displayLimit, setDisplayLimit] = useState(30);\n', '');

// 2. Remove all setDisplayLimit calls
content = content.replace(/setDisplayLimit\([^)]+\);\n/g, '');
content = content.replace(/setDisplayLimit\([^)]+\);/g, '');

// 3. Remove displayLimit from displayData
content = content.replace('const displayData = [...messages].reverse().slice(0, displayLimit);', 'const displayData = [...messages].reverse();');

// 4. Update handleLoadMore to purely fetch from API
const oldHandleLoadMore = `  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    
    // First, if we still have local messages that aren't displayed, just show them
    if (displayLimit < messages.length) {
      
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
          prev.  forEach(m => messageMap.set(m.message_id, m));
          const updated = Array.from(messageMap.values()).sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          CacheService.saveMessages(channelId as string, updated);
          return updated;
        });
        
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

const newHandleLoadMore = `  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    
    // Fetch from API
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

// we have to be careful with exact string replacement, if spacing changed it won't match.
// let's just do a regex replace from `const handleLoadMore = async () => {` to the end of the function.
const fnStart = 'const handleLoadMore = async () => {';
const startIndex = content.indexOf(fnStart);
if (startIndex !== -1) {
    let braceCount = 0;
    let endIndex = startIndex;
    let started = false;
    for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
            started = true;
        }
        if (content[i] === '}') {
            braceCount--;
        }
        if (started && braceCount === 0) {
            endIndex = i + 1;
            break;
        }
    }
    
    content = content.substring(0, startIndex) + newHandleLoadMore.trim() + content.substring(endIndex);
}

// Ensure old displayLimit logic in scrollToMessage is removed too
content = content.replace('if (index >= displayLimit) {', 'if (false) {'); 

fs.writeFileSync(filePath, content);
console.log("Removed displayLimit");
