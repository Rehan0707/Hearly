const fs = require('fs');
const path = require('path');

function scan(root) {
  const issues = [];
  const manifestPath = path.join(root, 'public', 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!manifest.permissions || !manifest.permissions.includes('windows')) {
      issues.push({ file: 'public/manifest.json', msg: 'missing windows permission' });
    }
  }
  return issues;
}

const root = process.argv[2] || process.cwd();
const results = scan(root);
console.log(JSON.stringify(results, null, 2));
