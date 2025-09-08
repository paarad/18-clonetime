import { chromium } from 'playwright'

export interface CrawlResult {
  url: string
  title: string
  content: string
  error?: string
}

export async function crawlWebsite(url: string): Promise<CrawlResult[]> {
  const results: CrawlResult[] = []
  
  // Primary URL
  const mainResult = await crawlSinglePage(url)
  results.push(mainResult)
  
  if (mainResult.error) {
    return results
  }
  
  // Try to find additional pages like /features, /pricing, /docs, etc.
  const additionalPaths = [
    '/features',
    '/pricing', 
    '/docs',
    '/help',
    '/about',
    '/how-it-works'
  ]
  
  const baseUrl = new URL(url).origin
  
  for (const path of additionalPaths) {
    try {
      const additionalUrl = `${baseUrl}${path}`
      const result = await crawlSinglePage(additionalUrl)
      if (!result.error && result.content.length > 100) {
        results.push(result)
      }
    } catch {
      // Skip failed additional pages
    }
  }
  
  return results.slice(0, 5) // Limit to 5 pages max
}

async function crawlSinglePage(url: string): Promise<CrawlResult> {
  try {
    // Try Playwright first for JS-heavy sites
    return await crawlWithPlaywright(url)
  } catch (playwrightError) {
    try {
      // Fallback to simple fetch
      return await crawlWithFetch(url)
    } catch (fetchError) {
      return {
        url,
        title: '',
        content: '',
        error: `Failed to crawl: ${playwrightError}`
      }
    }
  }
}

async function crawlWithPlaywright(url: string): Promise<CrawlResult> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 })
    
    const title = await page.title()
    const content = await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, nav, footer')
      scripts.forEach(el => el.remove())
      
      // Get main content
      const main = document.querySelector('main') || document.body
      return main?.innerText || ''
    })
    
    await browser.close()
    
    return {
      url,
      title,
      content: content.slice(0, 5000) // Limit content length
    }
  } catch (error) {
    await browser.close()
    throw error
  }
}

async function crawlWithFetch(url: string): Promise<CrawlResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Clonetime/1.0)'
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  const html = await response.text()
  
  // Basic HTML parsing to extract text content
  const title = html.match(/<title[^>]*>([^<]*)</i)?.[1] || ''
  const content = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000)
  
  return {
    url,
    title,
    content
  }
} 