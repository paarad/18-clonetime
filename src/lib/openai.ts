import OpenAI from 'openai'
import { AnalysisResult, Mission } from './database.types'
import { CrawlResult } from './crawler'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function deriveSiteHints(crawlResults: CrawlResult[]) {
  const text = crawlResults
    .map(r => `${r.title}\n${r.content}`)
    .join('\n')
    .toLowerCase()

  const hasAuth = /(sign in|signin|log in|login|account|dashboard login|reset password|two[- ]?factor)/i.test(text)
  const hasAdmin = /(admin panel|admin dashboard|cms|content management|backoffice|back office|editor role)/i.test(text)
  const mentionsApi = /(api\s|api\(|rest api|graphql|swagger|openapi|developer api|endpoints)/i.test(text)
  const isPortfolioLike = /(portfolio|agency|clients|case studies|our work|about us|contact|services)/i.test(text) && !hasAuth && !hasAdmin

  return { hasAuth, hasAdmin, mentionsApi, isPortfolioLike }
}

function applyHintsFilter(analysis: AnalysisResult, hints: ReturnType<typeof deriveSiteHints>): AnalysisResult {
  const shouldRemove = (mission: Mission) => {
    const cat = mission.category.toLowerCase()
    if (!hints.hasAuth && (cat === 'accounts' || /auth|login|account/i.test(mission.title))) return true
    if (!hints.hasAdmin && (cat === 'admin' || /admin|dashboard/i.test(mission.title))) return true
    if (!hints.mentionsApi && (cat === 'api' || /api|third[- ]?party/i.test(mission.title))) return true
    return false
  }

  const filteredMissions = analysis.missions.filter(m => !shouldRemove(m))
  const summed = filteredMissions.reduce((acc, m) => acc + (typeof m.hours === 'number' ? m.hours : 0), 0)
  const adjustedTotal = Math.min(Math.max(summed || analysis.total_hours, 1), 48)

  return {
    ...analysis,
    missions: filteredMissions,
    total_hours: adjustedTotal,
  }
}

export async function analyzeWebsite(
  crawlResults: CrawlResult[],
  tier: 'speedrun' | 'mvp' | 'prod-lite'
): Promise<AnalysisResult> {
  const mainContentUncapped = crawlResults
    .filter(result => !result.error)
    .map(result => `URL: ${result.url}\nTitle: ${result.title}\nContent: ${result.content}`)
    .join('\n\n---\n\n')

  // Trim to keep token usage reasonable
  const mainContent = mainContentUncapped.slice(0, 4000)

  const tierMultipliers = {
    speedrun: 0.5,
    mvp: 1.5,
    'prod-lite': 5
  }

  const tierDescriptions = {
    speedrun: 'quick prototype with minimal features, no auth, basic UI',
    mvp: 'functional product with core features, basic auth, decent UI',
    'prod-lite': 'production-ready with full features, proper auth, polished UI'
  }

  const hints = deriveSiteHints(crawlResults)
  const hintsText = `Site hints:\n- hasAuth: ${hints.hasAuth}\n- hasAdmin: ${hints.hasAdmin}\n- mentionsApi: ${hints.mentionsApi}\n- isPortfolioLike: ${hints.isPortfolioLike}`

  const prompt = `You are analyzing a website to estimate how long it would take to rebuild as a ${tierDescriptions[tier]}.

Website content (trimmed):
${mainContent}

${hintsText}

Provide a JSON response with exactly this structure:
{
  "total_hours": <number>,
  "confidence": <0-1>,
  "missions": [
    {
      "category": "<category>",
      "title": "<mission title>",
      "hours": <number>,
      "confidence": <0-1>
    }
  ],
  "product_map": {
    "roles": ["<user role>"],
    "objects": ["<main data objects>"],
    "stories": [{"role": "<role>", "i_can": "<action>"}]
  },
  "evidence": [
    { "url": "<page url>", "snippet": "<relevant text from page>" }
  ],
  "scope": "<assumptions and limitations>",
  "summary": "<one-sentence layman summary of what this product does>"
}

Rules:
- Respect the site hints. If hints say there is no auth/admin/api (typical for portfolio sites), do NOT add those features in any tier.
- Make tier differences explicit in missions.
- Prefix each mission title with one of: [S] (speedrun essential), [M] (MVP additions), [P] (Prod-lite polish/expansion).
- For speedrun tier, include only [S] missions in the total.
- For MVP tier, include [S] + [M].
- For Prod-lite tier, include [S] + [M] + [P].
- Ensure total_hours reflects the included missions for the requested tier and DIFFERS between tiers.
- Produce a clear, 1-sentence "summary" that a non-technical person understands.
- Mission categories must be one of: Accounts, Data, Content, Commerce, Social, API, Admin, Analytics, Notifications, Search, Media.

Base time guidance (optimistic, hours not days):
- Simple landing page: 1-2h
- Basic blog with CMS: 2-4h
- Simple e-commerce: 4-8h
- Social app (posts + users): 8-16h
- Complex SaaS dashboard: 16-32h

For ${tier} tier, adjust base estimates appropriately (${tierMultipliers[tier]}x feel), but keep realistic and optimistic. Always return valid JSON only.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert developer who estimates build times. Respond only with strict JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 800
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    const analysis = JSON.parse(content) as AnalysisResult
    
    // Validate required fields
    if (!analysis.total_hours || !analysis.missions || !analysis.product_map) {
      throw new Error('Invalid analysis format')
    }

    // Cap maximum estimate at 48 hours
    const cappedAnalysis = {
      ...analysis,
      total_hours: Math.min(analysis.total_hours, 48)
    }

    // Apply hints-based filtering
    return applyHintsFilter(cappedAnalysis, hints)
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    
    // Tier-specific fallback analysis so results differ between tiers
    const fallbackHoursMap = {
      speedrun: 4,
      mvp: 8,
      'prod-lite': 16
    } as const

    const total = fallbackHoursMap[tier]

    const fallback: AnalysisResult = {
      total_hours: total,
      confidence: 0.5,
      missions: [
        {
          category: 'Content',
          title: '[S] Core pages & basic UI',
          hours: Math.max(1, Math.round(total * 0.4)),
          confidence: 0.6
        },
        {
          category: 'Data',
          title: hints.isPortfolioLike ? '[S] Static content structure' : (tier === 'speedrun' ? '[S] Local state only' : '[M] Basic data model & CRUD'),
          hours: Math.max(1, Math.round(total * 0.3)),
          confidence: 0.6
        },
        ...(tier !== 'speedrun'
          ? [
              {
                category: 'Accounts',
                title: hints.hasAuth ? (tier === 'mvp' ? '[M] Basic auth & sessions' : '[P] Robust auth, roles, security') : '[M] (skip if no auth needed)',
                hours: Math.max(1, Math.round(total * 0.2)),
                confidence: 0.5
              }
            ]
          : []),
        ...(tier === 'prod-lite'
          ? [
              {
                category: 'Admin',
                title: hints.hasAdmin ? '[P] Admin tools, analytics & polish' : '[P] (skip if no admin needed)',
                hours: Math.max(1, Math.round(total * 0.1)),
                confidence: 0.5
              },
              {
                category: 'API',
                title: hints.mentionsApi ? '[P] Integrate third-party APIs' : '[P] (skip if no APIs needed)',
                hours: 1,
                confidence: 0.5
              }
            ]
          : [])
      ],
      product_map: {
        roles: ['User'],
        objects: ['Content'],
        stories: [{ role: 'User', i_can: 'access core functionality' }]
      },
      evidence: crawlResults.map(r => ({
        url: r.url,
        snippet: r.content.slice(0, 100)
      })),
      scope: `${tierDescriptions[tier]} - Fallback estimate with tier differentiation`,
      summary: 'A web product with core pages and basic functionality; higher tiers add data, auth, and admin tools.'
    }

    // Apply hints-based filtering to fallback too
    return applyHintsFilter(fallback, hints)
  }
} 