const { exec } = require('child_process')
const { promisify } = require('util')
const { shell, ipcRenderer } = require('electron')
const fs = require('original-fs').promises
const path = require('path')

document.getElementsByTagName('a')[0].onclick = () => shell.openExternal('https://github.com/ShirasawaSama/CefDetectorX')

let cnt = 0
let totalSize = 0
const TEN_MEGABYTES = 1000 * 1000 * 10
const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
const execAsync = promisify(exec)
const exists = file => fs.stat(file).then(it => it.isFile(), () => false)
const dirSize = async (dir, cache = { }, deep = 0) => {
  if (deep > 10) return
  try {
    const stats = await fs.stat(dir)
    if (cache[stats.ino]) return
    cache[stats.ino] = true
    totalSize += stats.size
    if (stats.isDirectory()) await fs.readdir(dir).then(files => Promise.all(files.map(it => dirSize(path.join(dir, it), cache, deep + 1))), () => { })
  } catch { }
}

const LIBCEF = 'cef_string_utf8_to_utf16'
const ELECTRON = 'third_party/electron_node'
const ELECTRON2 = 'register_atom_browser_web_contents'
const CEF_SHARP = 'CefSharp.Internals'
const NWJS = 'url-nwjs'
const MINI_ELECTRON = 'napi_create_buffer'
const MINI_BLINK = 'miniblink'

ipcRenderer
  .invoke('has-args', 'no-bgm')
  .then(async val => {
    if (val) return
    if (await exists(path.join(__dirname, 'bgm.mp3'))) {
      const audio = new Audio('bgm.mp3')
      audio.autoplay = true
      audio.loop = true
      audio.controls = true
      document.body.appendChild(audio)
    } else {
      const iframe = document.createElement('iframe')
      iframe.src = 'https://music.163.com/outchain/player?type=2&id=5264829&auto=1&height=32'
      iframe.frameBorder = 0
      iframe.border = 0
      iframe.marginwidth = 0
      iframe.marginheight = 0
      iframe.width = 280
      iframe.height = 52
      document.body.appendChild(iframe)
    }
  })

const getExeIcon = file => execAsync('powershell -Command "Add-Type -AssemblyName System.Drawing;$S=New-Object System.IO.MemoryStream;' +
  `[System.Drawing.Icon]::ExtractAssociatedIcon('${file}').ToBitmap().Save($S,[System.Drawing.Imaging.ImageFormat]::Png);$B=$S.ToArray();$S.Flush();$S.Dispose();'CefDetectorX{{'+[convert]::ToBase64String($B)+'}}'"`)
  .then(({ stdout }) => 'data:image/png;base64,' + /CefDetectorX{{(.+)}}/.exec(stdout)?.[1], console.error)
const prettySize = len => {
  let order = 0
  while (len >= 1024 && order < sizes.length - 1) {
    order++
    len /= 1024
  }
  return len.toFixed(2) + ' ' + sizes[order]
}

const cache = { }
const nodes = []
const mainElm = document.getElementsByTagName('main')[0]
const titleElm = document.getElementsByTagName('h2')[0]
const addApp = async (file, type, isDir = false) => {
  console.log('Found:', type, file)
  if (cache[file]) return
  const prevSize = totalSize
  await dirSize(isDir ? file : path.dirname(file))
  cache[file] = true
  const elm = document.createElement('section')
  const fileName = path.basename(file)
  elm.title = file
  nodes.push([totalSize - prevSize, elm])
  const icon = await getExeIcon(file)
  elm.innerHTML = (isDir || !icon ? '<h3>?</h3>' : `<img src="${icon}" alt="${fileName}">`) +
    `<h6 class=${!isDir && processes[file] ? 'running' : ''}>${fileName}</h6><p>${type}</p><sub>${prettySize(totalSize - prevSize)}</sub>`
  elm.onclick = () => isDir ? shell.openPath(file) : shell.showItemInFolder(file)
  mainElm.appendChild(elm)

  titleElm.innerText = `这台电脑上总共有 ${++cnt} 个 Chromium 内核的应用 (${prettySize(totalSize)})`
}

const processes = { }
try {
  const { stdout } = await execAsync('wmic process get ExecutablePath', { maxBuffer: TEN_MEGABYTES, windowsHide: true })
  stdout.replace(/\r/g, '').replace(/ +\n/g, '\n').split('\n').forEach(it => (processes[it] = 1))
} catch (e) {
  console.error(e)
}

const search = async (file) => {
  console.log('Searching:', file)
  try {
    let f = path.join(file, 'msedge.exe')
    if (await exists(f)) {
      await addApp(f, 'Edge')
      return [true]
    }
    if (await exists(path.join(file, 'chrome_pwa_launcher.exe')) && await exists(f = path.join(file, '../chrome.exe'))) {
      await addApp(f, 'Chrome')
      return [true]
    }
    let firstExe
    for (const it of (await fs.readdir(file)).filter(it => it.endsWith('.exe'))) {
      const fileName = path.join(file, it)
      const data = await fs.readFile(fileName)
      const fileNameLowerCase = it.toLowerCase()
      let type
      if (data.includes(ELECTRON) || data.includes(ELECTRON2)) type = 'Electron'
      else if (data.includes(NWJS)) type = 'NWJS'
      else if (data.includes(CEF_SHARP)) type = 'CefSharp'
      else if (data.includes(LIBCEF)) type = 'CEF'
      else if (!firstExe && !fileNameLowerCase.includes('unins') && !fileNameLowerCase.includes('setup') && !fileNameLowerCase.includes('report')) {
        firstExe = fileName
        continue
      } else continue
      await addApp(fileName, type)
      return [true]
    }
    return [false, firstExe]
  } catch (e) {
    console.error(e)
    return [false]
  }
}

const { stdout } = await execAsync('es.exe -s _percent.pak', { maxBuffer: TEN_MEGABYTES, windowsHide: true })

const cache2 = { }
for (const file of stdout.replace(/\r/g, '').split('\n')) {
  if (file.includes('$RECYCLE.BIN') || file.includes('OneDrive')) continue
  const dir = path.dirname(file)
  if (cache2[dir]) continue
  cache2[dir] = true
  if (await fs.stat(file).then(it => it.isDirectory(), () => true)) continue
  let res = await search(dir)
  if (res[0]) continue
  if (res[1]) await addApp(res[1], 'Unknown')
  else {
    res = await search(path.dirname(dir))
    if (res[0]) continue
    if (res[1]) await addApp(res[1], 'Unknown')
    else await addApp(dir, 'Unknown', true)
  }
}

const { stdout: mbStdout } = await execAsync('es.exe -regex node(.*?)\\.dll', { maxBuffer: TEN_MEGABYTES, windowsHide: true })
for (const file of mbStdout.replace(/\r/g, '').split('\n')) {
  if (file.includes('$RECYCLE.BIN') || file.includes('OneDrive') || await fs.stat(file).then(it => it.isDirectory(), () => true)) continue
  const dir = path.dirname(file)
  for (const it of (await fs.readdir(dir)).filter(it => it.endsWith('.exe'))) {
    const fileName = path.join(dir, it)
    const data = await fs.readFile(fileName)
    let type
    if (data.includes(MINI_ELECTRON)) type = 'Mini Electron'
    else if (data.includes(MINI_BLINK)) type = 'Mini Blink'
    else continue
    await addApp(fileName, type)
    break
  }
}

if (nodes.length) nodes.sort(([a], [b]) => b - a).forEach(([_, elm], i) => (elm.style.order = i.toString()))
else titleElm.innerText = '这台电脑上没有 Chromium 内核的应用 (也有可能是你没装 Everything)'
titleElm.className = 'running'
