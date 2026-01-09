#!/usr/bin/env ts-node --esm

/**
 * RSS Feed Migration Test Script
 *
 * Compares two RSS feeds to detect changes that would impact existing subscribers.
 * - Fetches baseline feed (current production)
 * - Fetches new feed (staging/new version)
 * - Simulates what subscribers would see if the new feed replaced the baseline
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - Test failures detected (old posts appearing as new)
 *   2 - Usage/fetch error
 */

import * as cheerio from 'cheerio'

interface FeedItem {
  guid: string
  link: string
  title: string
  pubDate: string
  pubDateParsed: Date | null
}

interface FeedData {
  title: string
  items: FeedItem[]
}

interface ComparisonResult {
  newItems: FeedItem[]
  removedItems: FeedItem[]
  modifiedItems: Array<{ baseline: FeedItem; updated: FeedItem; changes: string[] }>
}

async function fetchFeed(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response.text()
}

function parseFeed(xml: string): FeedData {
  const $ = cheerio.load(xml, { xmlMode: true })

  const title = $('channel > title').text() || $('feed > title').text() || 'Unknown Feed'

  const items: FeedItem[] = []

  // RSS 2.0 format
  $('item').each((_, element) => {
    const $item = $(element)
    const guid = $item.find('guid').text()
    const link = $item.find('link').text()
    const itemTitle = $item.find('title').text()
    const pubDate = $item.find('pubDate').text()

    items.push({
      guid: guid || link, // Use link as fallback GUID
      link,
      title: itemTitle,
      pubDate,
      pubDateParsed: pubDate ? new Date(pubDate) : null,
    })
  })

  // Atom format fallback
  if (items.length === 0) {
    $('entry').each((_, element) => {
      const $entry = $(element)
      const id = $entry.find('id').text()
      const link = $entry.find('link').attr('href') || ''
      const entryTitle = $entry.find('title').text()
      const published = $entry.find('published').text() || $entry.find('updated').text()

      items.push({
        guid: id || link,
        link,
        title: entryTitle,
        pubDate: published,
        pubDateParsed: published ? new Date(published) : null,
      })
    })
  }

  return { title, items }
}

function compareFeedItems(baseline: FeedData, updated: FeedData): ComparisonResult {
  const baselineGuids = new Set(baseline.items.map((item) => item.guid))
  const baselineLinks = new Set(baseline.items.map((item) => item.link))
  const updatedGuids = new Set(updated.items.map((item) => item.guid))

  // Items in updated feed that aren't in baseline (by GUID)
  const newItems = updated.items.filter(
    (item) => !baselineGuids.has(item.guid) && !baselineLinks.has(item.link)
  )

  // Items in baseline that aren't in updated (removed)
  const removedItems = baseline.items.filter((item) => !updatedGuids.has(item.guid))

  // Items that exist in both but may have changed
  const modifiedItems: ComparisonResult['modifiedItems'] = []
  for (const updatedItem of updated.items) {
    const baselineItem = baseline.items.find((b) => b.guid === updatedItem.guid)
    if (baselineItem) {
      const changes: string[] = []
      if (baselineItem.title !== updatedItem.title) {
        changes.push(`title: "${baselineItem.title}" → "${updatedItem.title}"`)
      }
      if (baselineItem.link !== updatedItem.link) {
        changes.push(`link: "${baselineItem.link}" → "${updatedItem.link}"`)
      }
      if (baselineItem.pubDate !== updatedItem.pubDate) {
        changes.push(`pubDate: "${baselineItem.pubDate}" → "${updatedItem.pubDate}"`)
      }
      if (changes.length > 0) {
        modifiedItems.push({ baseline: baselineItem, updated: updatedItem, changes })
      }
    }
  }

  return { newItems, removedItems, modifiedItems }
}

function isOldPost(item: FeedItem, cutoffDays: number = 7): boolean {
  if (!item.pubDateParsed) return false
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - cutoffDays)
  return item.pubDateParsed < cutoffDate
}

function formatDate(date: Date | null): string {
  if (!date) return 'unknown date'
  return date.toISOString().split('T')[0]
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('Usage: ts-node --esm scripts/test-rss-feed.ts <baseline-url> <new-url> [--cutoff-days=N]')
    console.error('')
    console.error('Arguments:')
    console.error('  baseline-url   URL of the current/production RSS feed')
    console.error('  new-url        URL of the new/staging RSS feed')
    console.error('  --cutoff-days  Days threshold for "old" posts (default: 7)')
    console.error('')
    console.error('Example:')
    console.error('  ts-node --esm scripts/test-rss-feed.ts https://mscottford.com/feed.xml https://staging.mscottford.com/feed.xml')
    process.exit(2)
  }

  const baselineUrl = args[0]
  const newUrl = args[1]
  let cutoffDays = 7

  for (const arg of args.slice(2)) {
    if (arg.startsWith('--cutoff-days=')) {
      cutoffDays = parseInt(arg.split('=')[1], 10)
    }
  }

  console.log('RSS Feed Migration Test')
  console.log('=======================')
  console.log(`Baseline: ${baselineUrl}`)
  console.log(`New:      ${newUrl}`)
  console.log(`Cutoff:   ${cutoffDays} days (posts older than this are considered "old")`)
  console.log('')

  let baselineFeed: FeedData
  let newFeed: FeedData

  try {
    console.log('Fetching baseline feed...')
    const baselineXml = await fetchFeed(baselineUrl)
    baselineFeed = parseFeed(baselineXml)
    console.log(`  Found ${baselineFeed.items.length} items in "${baselineFeed.title}"`)
  } catch (error) {
    console.error(`Error fetching baseline feed: ${error}`)
    process.exit(2)
  }

  try {
    console.log('Fetching new feed...')
    const newXml = await fetchFeed(newUrl)
    newFeed = parseFeed(newXml)
    console.log(`  Found ${newFeed.items.length} items in "${newFeed.title}"`)
  } catch (error) {
    console.error(`Error fetching new feed: ${error}`)
    process.exit(2)
  }

  console.log('')
  console.log('Comparing feeds...')
  console.log('')

  const comparison = compareFeedItems(baselineFeed, newFeed)

  let hasFailures = false

  // Categorize new items as genuinely new or problematic old posts
  const genuinelyNewItems = comparison.newItems.filter((item) => !isOldPost(item, cutoffDays))
  const oldPostsAppearingNew = comparison.newItems.filter((item) => isOldPost(item, cutoffDays))

  // Report genuinely new items (expected behavior)
  if (genuinelyNewItems.length > 0) {
    console.log(`✓ ${genuinelyNewItems.length} genuinely new item(s) detected (expected):`)
    for (const item of genuinelyNewItems) {
      console.log(`    - "${item.title}" (${formatDate(item.pubDateParsed)})`)
    }
    console.log('')
  }

  // Report old posts appearing as new (FAILURE)
  if (oldPostsAppearingNew.length > 0) {
    hasFailures = true
    console.log(`✗ ${oldPostsAppearingNew.length} old post(s) would appear as NEW to subscribers:`)
    for (const item of oldPostsAppearingNew) {
      console.log(`    - "${item.title}" (${formatDate(item.pubDateParsed)})`)
      console.log(`      GUID: ${item.guid}`)
      console.log(`      Link: ${item.link}`)
    }
    console.log('')
    console.log('  This will cause existing subscribers to see old posts as new!')
    console.log('  Check if GUIDs or links have changed between feeds.')
    console.log('')
  }

  // Report removed items (informational)
  if (comparison.removedItems.length > 0) {
    console.log(`ℹ ${comparison.removedItems.length} item(s) removed from feed:`)
    for (const item of comparison.removedItems) {
      console.log(`    - "${item.title}" (${formatDate(item.pubDateParsed)})`)
    }
    console.log('')
  }

  // Report modified items (warning)
  if (comparison.modifiedItems.length > 0) {
    console.log(`⚠ ${comparison.modifiedItems.length} item(s) modified:`)
    for (const { updated, changes } of comparison.modifiedItems) {
      console.log(`    - "${updated.title}"`)
      for (const change of changes) {
        console.log(`        ${change}`)
      }
    }
    console.log('')
  }

  // Summary
  console.log('Summary')
  console.log('-------')
  console.log(`Baseline items:        ${baselineFeed.items.length}`)
  console.log(`New feed items:        ${newFeed.items.length}`)
  console.log(`Genuinely new:         ${genuinelyNewItems.length}`)
  console.log(`Old appearing as new:  ${oldPostsAppearingNew.length}`)
  console.log(`Removed:               ${comparison.removedItems.length}`)
  console.log(`Modified:              ${comparison.modifiedItems.length}`)
  console.log('')

  if (hasFailures) {
    console.log('FAILED: Old posts would appear as new to existing subscribers')
    process.exit(1)
  } else {
    console.log('PASSED: No old posts would appear as new')
    process.exit(0)
  }
}

main()
