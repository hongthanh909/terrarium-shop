const fs = require('fs');
const path = require('path');
function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (f === 'node_modules' || f === '.next') return;
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}
walkDir('apps/web/app/admin', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;
    
    // Fix the corrupted classes: "gap-2 -full hover" -> "gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(66,87,51,0.4)] hover"
    content = content.replace(/gap-2 -full hover:bg-\[#364a29\]/g, 'gap-2 bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(66,87,51,0.4)] hover:bg-[#364a29]');

    // Also fix any others that might have been corrupted:
    // Some might have been px-4 py-2:
    content = content.replace(/gap-2 px-4 py-2 -full hover:bg-\[#364a29\]/g, 'gap-2 bg-[#425733] text-white px-4 py-2 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(66,87,51,0.3)] hover:bg-[#364a29]');
    
    // Check for other "-full" corruptions
    content = content.replace(/ -full /g, ' bg-[#425733] text-white px-6 py-3 rounded-full font-semibold shadow-soft hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(66,87,51,0.4)] ');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Fixed ' + filePath);
    }
  }
});
