const fs = require('fs');
const path = require('path');

function search(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory() && !full.includes('node_modules') && !full.includes('.git') && !full.includes('dist')) {
      search(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const c = fs.readFileSync(full, 'utf8');
      const lines = c.split('\n');
      lines.forEach((l, i) => {
        if (l.includes('Chi Tiết') || l.includes('Chi tiết') || l.includes('chi tiết') || l.includes('Bắt Đầu Lăn Bánh')) {
          console.log(`${full}:${i+1} -> ${l.trim()}`);
        }
      });
    }
  }
}

search('src');

