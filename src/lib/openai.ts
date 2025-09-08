import OpenAI from 'openai'
import { AnalysisResult } from './database.types'
import { CrawlResult } from './crawler'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzeWebsite(
  crawlResults: CrawlResult[],
  tier: 'speedrun' | 'mvp' | 'prod-lite'
): Promise<AnalysisResult> {
  const mainContent = crawlResults
    .filter(result => !result.error)
    .map(result => `URL: ${result.url}\nTitle: ${result.title}\nContent: ${result.content}`)
    .join('\n\n---\n\n')

  const tierMultipliers = {
    speedrun: 1,
    mvp: 2.5,
    'prod-lite': 5
  }

  const tierDescriptions = {
    speedrun: 'quick prototype with minimal features, no auth, basic UI',
    mvp: 'functional product with core features, basic auth, decent UI',
    'prod-lite': 'production-ready with full features, proper auth, polished UI'
  }

  const prompt = `You are analyzing a website to estimate how long it would take to rebuild as a ${tierDescriptions[tier]}.

Website content:
${mainContent}

Please analyze this website and provide a JSON response with the following structure:
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
    {
      "url": "<page url>",
      "snippet": "<relevant text from page>"
    }
  ],
  "scope": "<assumptions and limitations>"
}

Mission categories should be one of: Accounts, Data, Content, Commerce, Social, API, Admin, Analytics, Notifications, Search, Media

Base time estimates on these factors:
- UI complexity (simple forms vs rich interactions)
- Data modeling needs (users, content, relationships)
- Core features (auth, CRUD, search, payments, etc.)
- Integration complexity

For ${tier} tier, multiply base estimates by ${tierMultipliers[tier]}x.

Be realistic but not overly pessimistic. Focus on core functionality needed to recreate the main value proposition.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert developer who can accurately estimate build times for web applications. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
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

    return analysis
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    
    // Return fallback analysis
    return {
      total_hours: 8,
      confidence: 0.5,
      missions: [
        {
          category: 'Data',
          title: 'Basic web application',
          hours: 8,
          confidence: 0.5
        }
      ],
      product_map: {
        roles: ['User'],
        objects: ['Content'],
        stories: [{ role: 'User', i_can: 'view content' }]
      },
      evidence: crawlResults.map(r => ({
        url: r.url,
        snippet: r.content.slice(0, 100)
      })),
      scope: `${tierDescriptions[tier]} - Analysis failed, showing fallback estimate`
    }
  }
} 