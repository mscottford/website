import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import fg from 'fast-glob'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')

const contentPostsDir = path.join(rootDir, 'content', 'posts')
const publicImagesDir = path.join(rootDir, 'public', 'images', 'posts')

async function copyPostImages() {
  // Find all image files in content/posts
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif']
  const pattern = `**/*.{${imageExtensions.join(',')}}`

  const images = await fg(pattern, {
    cwd: contentPostsDir,
    absolute: false,
  })

  if (images.length === 0) {
    console.log('No images found in content/posts')
    return
  }

  console.log(`Found ${images.length} images to copy`)

  // Ensure the public images directory exists
  await fs.mkdir(publicImagesDir, { recursive: true })

  // Copy each image to public/images/posts preserving the date folder structure
  for (const imagePath of images) {
    const sourcePath = path.join(contentPostsDir, imagePath)
    const destPath = path.join(publicImagesDir, imagePath)

    // Ensure destination directory exists
    await fs.mkdir(path.dirname(destPath), { recursive: true })

    // Copy the file
    await fs.copyFile(sourcePath, destPath)
    console.log(`Copied: ${imagePath}`)
  }

  console.log('Done copying post images')
}

copyPostImages().catch((err) => {
  console.error('Error copying post images:', err)
  process.exit(1)
})
