const fs = require('fs')
const path = require('path')
const fse = require('fs-extra');

const files = [
  ...fs.readdirSync('src').map(it => ['src/' + it, 'resources/app/' + it]),
  'LICENSE',
  'README.md'
]
switch (process.platform) {
  case 'win32':
    files.push("es.exe");
  case 'linux':
    //file.push();
}
console.log("OS Platform: " + process.platform)
console.log("OS Arch:  " + process.arch)

const electronRoot = path.resolve(require.resolve('electron'), '../dist')
const walkDir = dir => fs.promises.readdir(dir).then(list => Promise.all(list.map(async file => {
  const cur = path.join(dir, file)
  if ((await fs.promises.stat(cur)).isDirectory()) await walkDir(cur)
  else {
    const name = path.relative(electronRoot, cur).replace(/\\/g, '/')
    if (name === 'LICENSE' || name.startsWith('resources/')) return
    files.push([cur, name.startsWith('electron') ? 'CefDetectorX' + name.replace(/^electron/, '') : name])
  }
})))

fs.mkdir('build/CefDetectorX', {
  recursive: true
}, err => {
  if (err) {
    console.error(err);
  } else {
    console.log('Directory created successfully.');
  }
});

walkDir(electronRoot)
  .then(() => Promise.all(files.map(it => {
    const src = typeof it === 'string' ? it : it[0];
    const dst = 'build/CefDetectorX/' + (typeof it === 'string' ? path.basename(src) : it[1]);
    return fse.copy(src, dst);
  })))