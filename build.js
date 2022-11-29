const JSZip = require('jszip')
const fs = require('fs')

const files = [
  ...fs.readdirSync('resources/app').map(it => 'resources/app/' + it),
  ...fs.readdirSync('locales').map(it => 'locales/' + it),
  'chrome_100_percent.pak',
  'chrome_200_percent.pak',
  'd3dcompiler_47.dll',
  'es.exe',
  'ffmpeg.dll',
  'icudtl.dat',
  'libEGL.dll',
  'libGLESv2.dll',
  'LICENSE',
  'LICENSES.chromium.html',
  'README.md',
  'resources.pak',
  'snapshot_blob.bin',
  'v8_context_snapshot.bin',
  'version',
  'vk_swiftshader_icd.json',
  'vk_swiftshader.dll',
  'vulkan-1.dll'
]

const ZIP_OPTIONS = { type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } }
const zip = new JSZip()
zip.file('CefDetectorX/CefDetectorX.exe', fs.readFileSync('electron.exe'))
Promise
  .all(files.map(it => fs.promises.readFile(it).then(data => zip.file('CefDetectorX/' + it, data))))
  .then(() => zip.generateAsync(ZIP_OPTIONS))
  .then(data => fs.promises.writeFile('CefDetectorX-with-bgm.zip', data))
  .then(() => zip.remove('CefDetectorX/resources/app/bgm.mp3').generateAsync(ZIP_OPTIONS))
  .then(data => fs.promises.writeFile('CefDetectorX.zip', data))
