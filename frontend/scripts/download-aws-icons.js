import { existsSync, mkdirSync } from 'fs'
import { get } from 'https'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import AdmZip from 'adm-zip'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Using icepanel.io - not complete but has good coverage
const ICONS_URL = 'https://icon.icepanel.io/AWS/svg.zip'
const PUBLIC_ICONS_DIR = join(__dirname, '..', 'public', 'icons', 'aws')

async function downloadAndExtractIcons() {
  console.log('📦 Checking for AWS icons...')
  
  // Check if icons already exist
  if (existsSync(PUBLIC_ICONS_DIR)) {
    console.log('✅ AWS icons already exist, skipping download')
    return
  }

  console.log('⬇️  Downloading AWS icons from icepanel.io...')
  console.log('   Note: Not all AWS services have icons in this set')

  try {
    // Create directory if it doesn't exist
    mkdirSync(PUBLIC_ICONS_DIR, { recursive: true })

    // Download the zip file to a buffer
    const zipBuffer = await new Promise((resolve, reject) => {
      get(ICONS_URL, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          get(response.headers.location, (redirectResponse) => {
            if (redirectResponse.statusCode !== 200) {
              reject(new Error(`Failed to download: ${redirectResponse.statusCode}`))
              return
            }
            const data = []
            redirectResponse.on('data', chunk => data.push(chunk))
            redirectResponse.on('end', () => resolve(Buffer.concat(data)))
            redirectResponse.on('error', reject)
          }).on('error', reject)
        } else if (response.statusCode === 200) {
          const data = []
          response.on('data', chunk => data.push(chunk))
          response.on('end', () => resolve(Buffer.concat(data)))
          response.on('error', reject)
        } else {
          reject(new Error(`Failed to download: ${response.statusCode}`))
        }
      }).on('error', reject)
    })

    // Extract using adm-zip
    const zip = new AdmZip(zipBuffer)
    zip.extractAllTo(PUBLIC_ICONS_DIR, true)

    // Move all subfolders up if there's a single top-level folder
    const { readdirSync, statSync, renameSync } = await import('fs')
    const topLevel = readdirSync(PUBLIC_ICONS_DIR)
    if (topLevel.length === 1) {
      const maybeDir = topLevel[0]
      const maybeDirPath = join(PUBLIC_ICONS_DIR, maybeDir)
      if (statSync(maybeDirPath).isDirectory()) {
        const subItems = readdirSync(maybeDirPath)
        for (const item of subItems) {
          renameSync(join(maybeDirPath, item), join(PUBLIC_ICONS_DIR, item))
        }
        await import('fs/promises').then(fsPromises => fsPromises.rmdir(maybeDirPath))
      }
    }

    console.log('✅ AWS icons downloaded and extracted successfully!')
    console.log('   All folders and categories should now be present.')
  } catch (error) {
    console.error('❌ Failed to download AWS icons:', error.message)
    console.log('⚠️  Icons are optional - the app will use text fallbacks')
    console.log('   You can manually download icons from https://icon.icepanel.io/AWS/svg.zip')
    console.log('   and extract to: frontend/public/icons/aws/')
    process.exit(0) // Don't fail the build, just warn
  }
}

downloadAndExtractIcons()
