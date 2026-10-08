const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function checkDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (name.startsWith('@')) {
      checkDir(full);
      continue;
    }
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      const pkgJson = path.join(full, 'package.json');
      if (fs.existsSync(pkgJson)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
          let mainFile = pkg.main || 'index.js';
          let target = path.resolve(full, mainFile);
          if (!fs.existsSync(target) && !fs.existsSync(target + '.js') && !fs.existsSync(path.join(target, 'index.js'))) {
            console.log('Missing build for:', pkg.name, '@', pkg.version, 'expected:', mainFile);
            const out = execSync(`npm pack ${pkg.name}@${pkg.version}`, { cwd: __dirname }).toString().trim();
            const lines = out.split('\n');
            const tarName = lines[lines.length - 1].trim();
            console.log('Downloaded:', tarName);
            execSync(`tar -xzf "${tarName}"`, { cwd: __dirname });
            execSync(`xcopy /E /Y /I package "${full}"`, { cwd: __dirname, stdio: 'ignore' });
            fs.rmSync(path.join(__dirname, 'package'), { recursive: true, force: true });
            fs.unlinkSync(path.join(__dirname, tarName));
            console.log('Fixed:', pkg.name);
          }
        } catch (e) {
          console.error('Err checking', full, e.message);
        }
      }
      const nested = path.join(full, 'node_modules');
      if (fs.existsSync(nested)) {
        checkDir(nested);
      }
    }
  }
}

console.log('Scanning node_modules...');
checkDir(path.join(__dirname, 'node_modules'));
console.log('Scan complete.');
