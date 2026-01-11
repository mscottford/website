/**
 * Rollback to a previous deployment by restoring S3 object versions.
 *
 * Usage:
 *   pnpm rollback:staging [--versions-back N] [--dry-run]
 *   pnpm rollback:production [--versions-back N] [--dry-run]
 *
 * Options:
 *   --versions-back N  Number of versions to roll back (default: 1)
 *   --dry-run          Show what would be done without making changes
 *
 * Examples:
 *   pnpm rollback:staging                    # Roll back staging to previous deployment
 *   pnpm rollback:staging --versions-back 2  # Roll back staging 2 deployments
 *   pnpm rollback:staging --dry-run          # Preview rollback without changes
 */

import { execSync } from 'node:child_process'

interface ObjectVersion {
  key: string
  versionId: string
  isLatest: boolean
  lastModified: string
}

interface VersionsResponse {
  Versions?: Array<{
    Key: string
    VersionId: string
    IsLatest: boolean
    LastModified: string
  }>
  DeleteMarkers?: Array<{
    Key: string
    VersionId: string
    IsLatest: boolean
    LastModified: string
  }>
}

function parseArgs(): { bucket: string; versionsBack: number; dryRun: boolean } {
  const args = process.argv.slice(2)

  // First arg should be the bucket name
  const bucket = args[0]
  if (!bucket || bucket.startsWith('--')) {
    console.error('Usage: ts-node rollback-deployment.ts <bucket-name> [--versions-back N] [--dry-run]')
    console.error('')
    console.error('Use the npm scripts instead:')
    console.error('  pnpm rollback:staging [--versions-back N] [--dry-run]')
    console.error('  pnpm rollback:production [--versions-back N] [--dry-run]')
    process.exit(1)
  }

  let versionsBack = 1
  let dryRun = false

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--versions-back' && args[i + 1]) {
      versionsBack = parseInt(args[i + 1], 10)
      if (isNaN(versionsBack) || versionsBack < 1) {
        console.error('--versions-back must be a positive integer')
        process.exit(1)
      }
      i++
    } else if (args[i] === '--dry-run') {
      dryRun = true
    }
  }

  return { bucket, versionsBack, dryRun }
}

function listObjectVersions(bucket: string): ObjectVersion[] {
  const versions: ObjectVersion[] = []
  let continuationToken: string | undefined

  do {
    const cmd = continuationToken
      ? `aws s3api list-object-versions --bucket ${bucket} --key-marker "${continuationToken}"`
      : `aws s3api list-object-versions --bucket ${bucket}`

    const output = execSync(cmd, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 })
    const data: VersionsResponse & { NextKeyMarker?: string } = JSON.parse(output)

    if (data.Versions) {
      for (const v of data.Versions) {
        versions.push({
          key: v.Key,
          versionId: v.VersionId,
          isLatest: v.IsLatest,
          lastModified: v.LastModified,
        })
      }
    }

    continuationToken = data.NextKeyMarker
  } while (continuationToken)

  return versions
}

function groupVersionsByKey(versions: ObjectVersion[]): Map<string, ObjectVersion[]> {
  const grouped = new Map<string, ObjectVersion[]>()

  for (const v of versions) {
    const existing = grouped.get(v.key) || []
    existing.push(v)
    grouped.set(v.key, existing)
  }

  // Sort each group by lastModified descending (newest first)
  for (const [key, versionList] of grouped) {
    versionList.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    grouped.set(key, versionList)
  }

  return grouped
}

function rollback(bucket: string, versionsBack: number, dryRun: boolean): void {
  console.log(`\n🔄 Rolling back ${bucket} by ${versionsBack} version(s)...`)
  if (dryRun) {
    console.log('   (DRY RUN - no changes will be made)\n')
  } else {
    console.log('')
  }

  // Get all object versions
  console.log('📋 Listing object versions...')
  const versions = listObjectVersions(bucket)
  console.log(`   Found ${versions.length} total versions`)

  // Group by key
  const grouped = groupVersionsByKey(versions)
  console.log(`   Found ${grouped.size} unique objects\n`)

  let restoredCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const [key, versionList] of grouped) {
    // Find the version to restore (versionsBack positions after the current)
    const targetIndex = versionsBack

    if (targetIndex >= versionList.length) {
      // Not enough versions to roll back this far
      skippedCount++
      if (dryRun) {
        console.log(`⏭️  Skip: ${key} (only ${versionList.length} version(s) available)`)
      }
      continue
    }

    const targetVersion = versionList[targetIndex]
    const currentVersion = versionList[0]

    if (targetVersion.versionId === currentVersion.versionId) {
      skippedCount++
      continue
    }

    if (dryRun) {
      console.log(`📄 Would restore: ${key}`)
      console.log(`   From: ${currentVersion.versionId.substring(0, 16)}... (${currentVersion.lastModified})`)
      console.log(`   To:   ${targetVersion.versionId.substring(0, 16)}... (${targetVersion.lastModified})`)
    } else {
      try {
        // Copy the old version to make it the new current version
        const copySource = encodeURIComponent(`${bucket}/${key}?versionId=${targetVersion.versionId}`)
        execSync(
          `aws s3api copy-object --bucket ${bucket} --key "${key}" --copy-source "${copySource}"`,
          { encoding: 'utf-8', stdio: 'pipe' }
        )
        console.log(`✅ Restored: ${key}`)
        restoredCount++
      } catch (error) {
        console.error(`❌ Failed: ${key}`)
        errorCount++
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  if (dryRun) {
    console.log(`\n📊 Dry run summary:`)
    console.log(`   Would restore: ${grouped.size - skippedCount} objects`)
    console.log(`   Would skip: ${skippedCount} objects (not enough versions)`)
  } else {
    console.log(`\n📊 Rollback summary:`)
    console.log(`   Restored: ${restoredCount} objects`)
    console.log(`   Skipped: ${skippedCount} objects`)
    console.log(`   Errors: ${errorCount} objects`)
  }

  if (!dryRun && restoredCount > 0) {
    console.log('\n⚠️  Remember to invalidate the CloudFront cache:')
    console.log(`   aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"`)
  }

  console.log('')
}

// Main
const { bucket, versionsBack, dryRun } = parseArgs()
rollback(bucket, versionsBack, dryRun)
