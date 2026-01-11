/**
 * Tail CloudFront access logs from S3.
 *
 * Usage:
 *   pnpm logs:staging [--follow] [--lines N]
 *   pnpm logs:production [--follow] [--lines N]
 *
 * Options:
 *   --follow, -f    Continuously poll for new logs (every 30 seconds)
 *   --lines N, -n N Number of recent log entries to show (default: 50)
 *
 * Examples:
 *   pnpm logs:staging              # Show last 50 log entries
 *   pnpm logs:staging -n 100       # Show last 100 log entries
 *   pnpm logs:staging -f           # Follow logs in real-time
 *   pnpm logs:staging -f -n 20     # Follow, starting with last 20 entries
 */

import { execSync } from 'node:child_process'
import { createGunzip } from 'node:zlib'
import { Readable } from 'node:stream'

interface LogEntry {
  timestamp: Date
  clientIp: string
  method: string
  uri: string
  status: number
  bytes: number
  timeTaken: number
  userAgent: string
  referer: string
}

function parseArgs(): { bucket: string; follow: boolean; lines: number } {
  const args = process.argv.slice(2)

  const bucket = args[0]
  if (!bucket || bucket.startsWith('-')) {
    console.error('Usage: ts-node tail-access-logs.ts <bucket-name> [--follow] [--lines N]')
    console.error('')
    console.error('Use the npm scripts instead:')
    console.error('  pnpm logs:staging [--follow] [--lines N]')
    console.error('  pnpm logs:production [--follow] [--lines N]')
    process.exit(1)
  }

  let follow = false
  let lines = 50

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--follow' || args[i] === '-f') {
      follow = true
    } else if ((args[i] === '--lines' || args[i] === '-n') && args[i + 1]) {
      lines = parseInt(args[i + 1], 10)
      if (isNaN(lines) || lines < 1) {
        console.error('--lines must be a positive integer')
        process.exit(1)
      }
      i++
    }
  }

  return { bucket, follow, lines }
}

function listLogFiles(bucket: string, prefix: string): string[] {
  try {
    const output = execSync(
      `aws s3api list-objects-v2 --bucket ${bucket} --prefix "${prefix}" --query "Contents[].Key" --output json`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    )
    const keys = JSON.parse(output) as string[] | null
    return keys || []
  } catch {
    return []
  }
}

function downloadAndDecompressLog(bucket: string, key: string): string {
  try {
    // Download the gzipped log file
    const gzippedData = execSync(`aws s3 cp s3://${bucket}/${key} -`, {
      encoding: 'buffer',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    })

    // Decompress synchronously using zlib
    const zlib = require('node:zlib')
    const decompressed = zlib.gunzipSync(gzippedData)
    return decompressed.toString('utf-8')
  } catch (error) {
    return ''
  }
}

function parseLogLine(line: string): LogEntry | null {
  // CloudFront log format (tab-separated):
  // date time x-edge-location sc-bytes c-ip cs-method cs(Host) cs-uri-stem
  // sc-status cs(Referer) cs(User-Agent) cs-uri-query cs(Cookie) x-edge-result-type
  // x-edge-request-id x-host-header cs-protocol cs-bytes time-taken ...

  if (line.startsWith('#') || !line.trim()) {
    return null
  }

  const fields = line.split('\t')
  if (fields.length < 18) {
    return null
  }

  try {
    return {
      timestamp: new Date(`${fields[0]}T${fields[1]}Z`),
      clientIp: fields[4],
      method: fields[5],
      uri: decodeURIComponent(fields[7]),
      status: parseInt(fields[8], 10),
      bytes: parseInt(fields[3], 10),
      timeTaken: parseFloat(fields[17]),
      userAgent: fields[10] === '-' ? '-' : decodeURIComponent(fields[10]),
      referer: fields[9] === '-' ? '-' : fields[9],
    }
  } catch {
    return null
  }
}

function formatLogEntry(entry: LogEntry): string {
  const time = entry.timestamp.toISOString().replace('T', ' ').replace('Z', '')
  const status = entry.status >= 400 ? `\x1b[31m${entry.status}\x1b[0m` :
                 entry.status >= 300 ? `\x1b[33m${entry.status}\x1b[0m` :
                 `\x1b[32m${entry.status}\x1b[0m`
  const timeTaken = entry.timeTaken < 0.1 ? `\x1b[32m${entry.timeTaken.toFixed(3)}s\x1b[0m` :
                    entry.timeTaken < 0.5 ? `\x1b[33m${entry.timeTaken.toFixed(3)}s\x1b[0m` :
                    `\x1b[31m${entry.timeTaken.toFixed(3)}s\x1b[0m`

  return `${time} ${status} ${entry.method.padEnd(4)} ${entry.uri.substring(0, 60).padEnd(60)} ${timeTaken} ${entry.clientIp}`
}

function getRecentLogs(bucket: string, prefix: string, maxEntries: number): LogEntry[] {
  // List all log files
  const logFiles = listLogFiles(bucket, prefix)

  if (logFiles.length === 0) {
    return []
  }

  // Sort by name (which includes timestamp) in reverse order
  logFiles.sort().reverse()

  const entries: LogEntry[] = []

  // Process files until we have enough entries
  for (const key of logFiles) {
    if (entries.length >= maxEntries) {
      break
    }

    const content = downloadAndDecompressLog(bucket, key)
    const lines = content.split('\n')

    for (const line of lines) {
      const entry = parseLogLine(line)
      if (entry) {
        entries.push(entry)
      }
    }
  }

  // Sort by timestamp and return most recent
  entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  return entries.slice(-maxEntries)
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function tailLogs(bucket: string, prefix: string, lines: number, follow: boolean): Promise<void> {
  console.log(`\n📋 Tailing CloudFront logs from s3://${bucket}/${prefix}`)
  if (follow) {
    console.log('   (Press Ctrl+C to stop)\n')
  } else {
    console.log('')
  }

  let lastTimestamp: Date | null = null
  let seenEntries = new Set<string>()

  // Initial fetch
  const initialEntries = getRecentLogs(bucket, prefix, lines)

  if (initialEntries.length === 0) {
    console.log('No log entries found yet. CloudFront logs are typically delivered every few minutes.')
    if (!follow) {
      return
    }
  } else {
    for (const entry of initialEntries) {
      console.log(formatLogEntry(entry))
      seenEntries.add(`${entry.timestamp.getTime()}-${entry.uri}-${entry.clientIp}`)
      lastTimestamp = entry.timestamp
    }
  }

  if (!follow) {
    console.log(`\n📊 Showed ${initialEntries.length} log entries`)
    return
  }

  // Follow mode - poll for new logs
  console.log('\n--- Waiting for new logs (polling every 30s) ---\n')

  while (true) {
    await sleep(30000) // Poll every 30 seconds

    const newEntries = getRecentLogs(bucket, prefix, 100)

    for (const entry of newEntries) {
      const entryKey = `${entry.timestamp.getTime()}-${entry.uri}-${entry.clientIp}`

      if (!seenEntries.has(entryKey)) {
        if (!lastTimestamp || entry.timestamp > lastTimestamp) {
          console.log(formatLogEntry(entry))
          seenEntries.add(entryKey)
          lastTimestamp = entry.timestamp
        }
      }
    }

    // Prevent memory leak by limiting set size
    if (seenEntries.size > 10000) {
      seenEntries = new Set([...seenEntries].slice(-5000))
    }
  }
}

// Main
const { bucket, follow, lines } = parseArgs()
const prefix = 'cloudfront/'

tailLogs(bucket, prefix, lines, follow).catch(console.error)
