export function formatMessageTime(dateString?: string): string {
  if (!dateString) return "";

  let safeDateString = dateString;
  if (!safeDateString.endsWith('Z') && !safeDateString.includes('+')) {
    safeDateString += 'Z';
  }

  const date = new Date(safeDateString);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  
  // Strip time for strict day comparisons
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffTime = today.getTime() - targetDay.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Today -> 7:18 AM
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  // Yesterday -> Yesterday
  if (diffDays === 1) {
    return "Yesterday";
  }

  // This week -> Mon, Tue, etc.
  if (diffDays > 1 && diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  // Older -> 30/06/26
  return date.toLocaleDateString([], { 
    day: '2-digit', 
    month: '2-digit', 
    year: '2-digit' 
  });
}
