const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;
walkDir('./apps/web/app/tiem-nho-nth24', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Replace exact quotes
    content = content.replace(/\"\/admin\//g, '"/tiem-nho-nth24/');
    content = content.replace(/\'\/\admin\//g, "'/tiem-nho-nth24/");
    content = content.replace(/\`\/admin\//g, '`/tiem-nho-nth24/');
    
    if (original !== content) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
      count++;
    }
  }
});
console.log('Total files updated:', count);
