import fs from 'fs'

const transcriptPath =
  'C:/Users/USER/.cursor/projects/c-Proyectos/agent-transcripts/50781931-90bb-4f99-a158-85e978030652/50781931-90bb-4f99-a158-85e978030652.jsonl'
const outDir = 'c:/Proyectos/Cocodrilito/cocodrilito-web/src/app/(auth)/login'

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n')
for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  if (!line.trim()) continue
  let obj
  try {
    obj = JSON.parse(line)
  } catch {
    continue
  }
  for (const part of obj.message?.content || []) {
    const text = part.text
    if (!text?.includes('<!DOCTYPE')) continue

    console.log('line', i + 1, 'len', text.length)
    console.log('style open', text.indexOf('<style>'))
    console.log('style close', text.indexOf('</style>'))

    const styleStart = text.indexOf('<style>')
    const styleEnd = text.indexOf('</style>')
    if (styleStart >= 0 && styleEnd > styleStart) {
      const css = text.slice(styleStart + 7, styleEnd)
      fs.writeFileSync(`${outDir}/_extracted_style.css`, css.trim())
      console.log('CSS', css.length)
    }

    const scriptStart = text.indexOf('<script>')
    const scriptEnd = text.indexOf('</script>')
    if (scriptStart >= 0 && scriptEnd > scriptStart) {
      const js = text.slice(scriptStart + 8, scriptEnd)
      fs.writeFileSync(`${outDir}/_extracted_script.js`, js.trim())
      console.log('JS', js.length)
    }

    const bodyStart = text.indexOf('<body>')
    const bodyEnd = text.indexOf('</body>')
    if (bodyStart >= 0 && bodyEnd > bodyStart) {
      const body = text.slice(bodyStart + 6, bodyEnd)
      fs.writeFileSync(`${outDir}/_extracted_body.html`, body.trim())
      console.log('BODY', body.length)
    }

    process.exit(0)
  }
}
console.log('not found')
process.exit(1)
