import fs from 'fs'

const src = 'c:/Proyectos/Cocodrilito/cocodrilito-web/src/app/(auth)/login/_extracted_style.css'
const dest = 'c:/Proyectos/Cocodrilito/cocodrilito-web/src/app/(auth)/login/login-platform.css'

let css = fs.readFileSync(src, 'utf8')

css = css.replace(
  '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }',
  '.loginRoot, .loginRoot *, .loginRoot *::before, .loginRoot *::after { box-sizing: border-box; margin: 0; padding: 0; }'
)

css = css.replace(
  `html, body {
  height: 100%;
  background: #060e07;
  font-family: 'Raleway', sans-serif;
  overflow-x: hidden;
}`,
  `.loginRoot {
  min-height: 100vh;
  width: 100%;
  background: #060e07;
  font-family: var(--font-raleway), 'Raleway', sans-serif;
  overflow-x: hidden;
  position: relative;
}`
)

fs.writeFileSync(dest, css)
console.log('written', dest, css.length)
