const JSZip = require('jszip')
const fs = require('fs')
const path = require('path')

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

const ZIP_OPTIONS = {
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: {
    level: 9
  }
}
const zip = new JSZip()
walkDir(electronRoot)
  .then(() => Promise.all(files.map(it => fs.promises.readFile(typeof it === 'string' ? it : it[0]).then(data => zip.file('CefDetectorX/' + (typeof it === 'string' ? it : it[1]), data)))))
  .then(() => console.log(Object.keys(zip.files)))
  .then(() => zip.generateAsync(ZIP_OPTIONS))
  .then(data => fs.promises.writeFile('./build/CefDetectorX-' + process.platform + '-' + process.arch + '-with-bgm.zip', data))
  .then(() => zip.remove('CefDetectorX/resources/app/bgm.mp3').generateAsync(ZIP_OPTIONS))
  .then(data => fs.promises.writeFile('./build/CefDetectorX-' + process.platform + '-' + process.arch + '.zip', data))