'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Clock, Zap, Target, CheckCircle } from 'lucide-react'
import { validateUrl, TIER_OPTIONS, TierType, normalizeUrl } from '@/lib/analysis'
import { AnalysisResult } from '@/lib/database.types'
import AnalysisDisplay from '@/components/AnalysisDisplay'

export default function HomePage() {
  const [inputUrl, setInputUrl] = useState('')
  const [analyzedUrl, setAnalyzedUrl] = useState('')
  const [selectedTier, setSelectedTier] = useState<TierType>('mvp')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!inputUrl.trim()) {
      setError('Please enter a URL')
      return
    }

    const candidate = /^(https?:)\/\//i.test(inputUrl) ? inputUrl.trim() : `https://${inputUrl.trim()}`

    if (!validateUrl(candidate)) {
      setError('Please enter a valid URL')
      return
    }

    const canonical = normalizeUrl(candidate)

    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)
    setAnalyzedUrl(canonical)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: canonical,
          tier: selectedTier,
          force: process.env.NODE_ENV === 'development',
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const tierIcons = {
    speedrun: Zap,
    mvp: Target,
    'prod-lite': CheckCircle
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-4">
          How long to <span className="text-blue-600">clone</span> this?
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Paste any product website and get an instant estimate of how long it would take 
          to rebuild it from scratch. No scale, no enterprise infra - just the minimum lovable version.
        </p>
      </div>

      {/* Input Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Analyze a Product
          </CardTitle>
          <CardDescription>
            Enter a product URL and choose your target complexity level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <label htmlFor="url" className="text-sm font-medium text-slate-700">
              Product URL
            </label>
            <Input
              id="url"
              type="url"
              placeholder="youtube.com"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Tier Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">
              Build Complexity
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TIER_OPTIONS.map((tier) => {
                const Icon = tierIcons[tier.value]
                const isSelected = selectedTier === tier.value
                return (
                  <button
                    key={tier.value}
                    onClick={() => setSelectedTier(tier.value)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-5 h-5 ${
                        isSelected ? 'text-blue-600' : 'text-slate-500'
                      }`} />
                      <span className={`font-medium ${
                        isSelected ? 'text-blue-900' : 'text-slate-900'
                      }`}>
                        {tier.label}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      isSelected ? 'text-blue-700' : 'text-slate-600'
                    }`}>
                      {tier.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Analyze Button */}
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !inputUrl.trim()}
            size="lg"
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Product'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <AnalysisDisplay 
          analysis={analysis}
          url={analyzedUrl}
          tier={selectedTier}
        />
      )}

      {/* Example Section */}
      {!analysis && (
        <div className="text-center text-slate-500">
          <p className="mb-4">Try analyzing popular products like:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['https://stripe.com', 'https://notion.so', 'https://linear.app'].map((exampleUrl) => (
              <Badge 
                key={exampleUrl}
                variant="outline" 
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => setInputUrl(exampleUrl)}
              >
                {exampleUrl.replace('https://', '')}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
