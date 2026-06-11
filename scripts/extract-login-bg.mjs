import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cssPath = path.join(__dirname, '../src/app/(auth)/login/login-platform.css')
const outPath = path.join(__dirname, '../public/login-bg.jpg')

const css = fs.readFileSync(cssPath, 'utf8')
const m = css.match(/url\('data:image\/jpeg;base64,([^']+)'\)/)
if (!m) {
  console.error('base64 background not found')
  process.exit(1)
}

fs.writeFileSync(outPath, Buffer.from(m[1], 'base64'))
const next = css.replace(
  /url\('data:image\/jpeg;base64,[^']+'\)/,
  "url('/login-bg.jpg')"
)
fs.writeFileSync(cssPath, next)
console.log('written', outPath, fs.statSync(outPath).size, 'bytes')
