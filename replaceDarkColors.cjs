const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('src', (filePath) => {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    if (content.includes('#050B14')) {
      content = content.replace(/#050B14/g, '#050708');
      updated = true;
    }
    if (content.includes('#04121C')) {
      content = content.replace(/#04121C/g, '#050708');
      updated = true;
    }
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
