import { execaCommand } from 'execa'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/rtfeldman/elm-spa-example'
const COMMIT = 'cb32acd73c3d346d0064e7923049867d8ce67193'

const getTestName = (line) => {
  return (
    'elm-spa-' +
    line
      .toLowerCase()
      .trim()
      .replaceAll(' ', '-')
      .replaceAll('/', '-')
      .replace('.elm', '')
  )
}

const getAllTests = async (folder) => {
  const dirents = await readdir(folder, { recursive: true })
  const allTests = []
  for (const dirent of dirents) {
    if (!dirent.endsWith('.elm')) {
      continue
    }
    const filePath = `${folder}/${dirent}`
    const testName = getTestName(dirent)
    const fileContent = await readFile(filePath, 'utf8')
    allTests.push({
      testName,
      testContent: fileContent,
    })
  }
  return allTests
}

const writeTestFiles = async (allTests) => {
  for (const test of allTests) {
    await writeFile(`${root}/test/cases/${test.testName}.elm`, test.testContent)
  }
}

const main = async () => {
  process.chdir(root)
  await rm(`${root}/.tmp`, { recursive: true, force: true })
  await execaCommand(`git clone ${REPO} .tmp/elm-spa`)
  process.chdir(`${root}/.tmp/elm-spa`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  await cp(`${root}/.tmp/elm-spa/src`, `${root}/.tmp/elm-spa-src`, {
    recursive: true,
  })
  const allTests = await getAllTests(`${root}/.tmp/elm-spa-src`)
  await writeTestFiles(allTests)
}

main()
