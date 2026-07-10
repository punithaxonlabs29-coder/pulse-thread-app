const fs = require('fs');
const filePath = 'c:/wamp64/www/pulse/pulse-thread/app/chat.tsx';
let content = fs.readFileSync(filePath, 'utf8');
if (!content.includes('./chat.styles')) {
    content = content.replace('import { formatDateHeader, formatTimeOnly } from "../utils/date";', 'import { formatDateHeader, formatTimeOnly } from "../utils/date";\nimport { styles } from "./chat.styles";');
    fs.writeFileSync(filePath, content);
}
console.log("Done");
