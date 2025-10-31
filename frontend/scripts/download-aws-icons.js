import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { get } from 'https'
import { pipeline } from 'stream/promises'
import { createUnzip } from 'zlib'
import { Extract } from 'unzipper'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ICONS_URL = 'https://icon.icepanel.io/AWS/svg.zip'
const PUBLIC_ICONS_DIR = join(__dirname, '..', 'public', 'icons', 'aws')
const TEMP_ZIP = join(__dirname, '..', 'temp-aws-icons.zip')

async function downloadAndExtractIcons() {
  console.log('📦 Checking for AWS icons...')
  
  // Check if icons already exist
  if (existsSync(PUBLIC_ICONS_DIR)) {
    console.log('✅ AWS icons already exist, skipping download')
    return
  }

  console.log('⬇️  Downloading AWS icons from icepanel.io...')

  try {
    // Create directory if it doesn't exist
    mkdirSync(PUBLIC_ICONS_DIR, { recursive: true })

    // Download the zip file
    await new Promise((resolve, reject) => {
      get(ICONS_URL, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          get(response.headers.location, (redirectResponse) => {
            if (redirectResponse.statusCode !== 200) {
              reject(new Error(`Failed to download: ${redirectResponse.statusCode}`))
              return
            }
            
            // Extract directly to public/icons/aws
            redirectResponse
              .pipe(Extract({ path: PUBLIC_ICONS_DIR }))
              .on('close', () => {
                console.log('✅ AWS icons downloaded and extracted successfully!')
                resolve()
              })
              .on('error', reject)
          }).on('error', reject)
        } else if (response.statusCode === 200) {
          // Extract directly to public/icons/aws
          response
            .pipe(Extract({ path: PUBLIC_ICONS_DIR }))
            .on('close', () => {
              console.log('✅ AWS icons downloaded and extracted successfully!')
              resolve()
            })
            .on('error', reject)
        } else {
          reject(new Error(`Failed to download: ${response.statusCode}`))
        }
      }).on('error', reject)
    })
  } catch (error) {
    console.error('❌ Failed to download AWS icons:', error.message)
    console.log('⚠️  You may need to download them manually from:')
    console.log('   https://icon.icepanel.io/AWS/svg.zip')
    console.log('   and extract to: frontend/public/icons/aws/')
    process.exit(0) // Don't fail the build, just warn
  }
}

downloadAndExtractIcons()
