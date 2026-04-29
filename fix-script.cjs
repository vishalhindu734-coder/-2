const fs = require('fs');
let content = fs.readFileSync('components/AreaMgmtView.tsx', 'utf8');
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\${/g, '${');
fs.writeFileSync('components/AreaMgmtView.tsx', content);

let appContent = fs.readFileSync('App.tsx', 'utf8');
appContent = appContent.replace(/\\`/g, '`');
appContent = appContent.replace(/\\\${/g, '${');
fs.writeFileSync('App.tsx', appContent);
