/**
 * Tests S3 routing rules against a live URL to verify redirects work correctly.
 *
 * Usage: pnpm exec ts-node --esm scripts/test-redirects.ts <base-url>
 *
 * Example:
 *   pnpm exec ts-node --esm scripts/test-redirects.ts https://staging.mscottford.com
 *   pnpm exec ts-node --esm scripts/test-redirects.ts https://mscottford.com
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

interface S3RoutingRule {
  Condition: { KeyPrefixEquals: string }
  Redirect: {
    HttpRedirectCode: string
    ReplaceKeyWith: string
  }
}

interface TestResult {
  source: string
  expectedTarget: string
  actualTarget: string | null
  statusCode: number | null
  success: boolean
  error?: string
}

async function testRedirect(
  baseUrl: string,
  rule: S3RoutingRule
): Promise<TestResult> {
  const source = `/${rule.Condition.KeyPrefixEquals}`
  const expectedTarget = `/${rule.Redirect.ReplaceKeyWith}`
  const fullUrl = `${baseUrl}${source}`

  try {
    const response = await fetch(fullUrl, {
      redirect: 'manual', // Don't follow redirects, we want to inspect them
    })

    const locationHeader = response.headers.get('location')
    const statusCode = response.status

    // Check if it's a redirect
    if (statusCode === 301 || statusCode === 302) {
      // Normalize the location for comparison
      let actualTarget = locationHeader

      if (actualTarget) {
        // If it's an absolute URL, extract the path
        try {
          const url = new URL(actualTarget)
          actualTarget = url.pathname + url.search
        } catch {
          // It's already a relative path
        }
      }

      const success = actualTarget === expectedTarget
      return {
        source,
        expectedTarget,
        actualTarget,
        statusCode,
        success,
      }
    }

    return {
      source,
      expectedTarget,
      actualTarget: locationHeader,
      statusCode,
      success: false,
      error: `Expected 301 redirect, got ${statusCode}`,
    }
  } catch (error) {
    return {
      source,
      expectedTarget,
      actualTarget: null,
      statusCode: null,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function main() {
  const baseUrl = process.argv[2]

  if (!baseUrl) {
    console.error('Usage: pnpm exec ts-node --esm scripts/test-redirects.ts <base-url>')
    console.error('')
    console.error('Example:')
    console.error('  pnpm exec ts-node --esm scripts/test-redirects.ts https://staging.mscottford.com')
    process.exit(1)
  }

  // Remove trailing slash from base URL
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')

  // Read routing rules
  const rulesPath = path.join(
    import.meta.dirname,
    '../deploy/terraform/s3-routing-rules.json'
  )

  if (!fs.existsSync(rulesPath)) {
    console.error(`Routing rules file not found: ${rulesPath}`)
    console.error('Run "pnpm generate:redirects" first to generate the file.')
    process.exit(1)
  }

  const rules: S3RoutingRule[] = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'))

  console.log(`Testing ${rules.length} redirects against ${normalizedBaseUrl}`)
  console.log('')

  const results: TestResult[] = []
  let passed = 0
  let failed = 0

  for (const rule of rules) {
    const result = await testRedirect(normalizedBaseUrl, rule)
    results.push(result)

    if (result.success) {
      passed++
      console.log(`✓ ${result.source} -> ${result.expectedTarget}`)
    } else {
      failed++
      console.log(`✗ ${result.source}`)
      console.log(`    Expected: ${result.expectedTarget}`)
      console.log(`    Actual:   ${result.actualTarget ?? 'N/A'}`)
      console.log(`    Status:   ${result.statusCode ?? 'N/A'}`)
      if (result.error) {
        console.log(`    Error:    ${result.error}`)
      }
    }
  }

  console.log('')
  console.log('Summary:')
  console.log(`  Passed: ${passed}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Total:  ${results.length}`)

  process.exit(failed > 0 ? 1 : 0)
}

main()
