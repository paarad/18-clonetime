import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizeUrl, generateFingerprint, validateUrl } from '@/lib/analysis'
import { crawlWebsite } from '@/lib/crawler'
import { analyzeWebsite } from '@/lib/openai'
import { AnalysisResult } from '@/lib/database.types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, tier, force } = body as { url: string; tier: string; force?: boolean }

    // Validate input
    if (!url || !tier) {
      return NextResponse.json(
        { error: 'URL and tier are required' },
        { status: 400 }
      )
    }

    if (!validateUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    if (!['speedrun', 'mvp', 'prod-lite'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be speedrun, mvp, or prod-lite' },
        { status: 400 }
      )
    }

    // Normalize URL and generate fingerprint
    const canonicalUrl = normalizeUrl(url)
    const fingerprint = generateFingerprint(canonicalUrl, tier)

    const shouldBypassCache = process.env.NODE_ENV === 'development' && force === true

    // Check if analysis already exists (unless bypassing cache)
    if (!shouldBypassCache) {
      const { data, error: fetchError } = await supabase
        .from('clonetime_analyses')
        .select('*')
        .eq('fingerprint', fingerprint)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Database fetch error:', fetchError)
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      }

      // If analysis exists, return it
      if (data) {
        return NextResponse.json((data as { result: AnalysisResult }).result)
      }
    }

    // Perform new analysis
    console.log(`Starting analysis for ${canonicalUrl} (${tier})${shouldBypassCache ? ' [force]' : ''}`)

    // Step 1: Crawl the website
    const crawlResults = await crawlWebsite(url)
    console.log(`Crawled ${crawlResults.length} pages`)

    // Step 2: Analyze with OpenAI
    const analysisResult = await analyzeWebsite(crawlResults, tier as 'speedrun' | 'mvp' | 'prod-lite')
    console.log(`Analysis complete: ${analysisResult.total_hours} hours`)

    // Step 3: Store/update in database
    const analysisRecord = {
      url: url,
      url_canonical: canonicalUrl,
      tier: tier as 'speedrun' | 'mvp' | 'prod-lite',
      fingerprint: fingerprint,
      result: analysisResult,
      is_public: true
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase as any)
      .from('clonetime_analyses')
      .upsert([analysisRecord], { onConflict: 'fingerprint' })

    if (upsertError) {
      console.error('Database upsert error:', upsertError)
      // Still return the analysis even if DB upsert fails
    }

    return NextResponse.json(analysisResult)

  } catch (error) {
    console.error('Analysis error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Analysis failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Get recent public analyses for the precedents page
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '10', 10)
  const search = searchParams.get('search')

  try {
    let query = supabase
      .from('clonetime_analyses')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 50))

    if (search) {
      query = query.or(`url.ilike.%${search}%,url_canonical.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analyses' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])

  } catch (error) {
    console.error('GET analyses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    )
  }
}
