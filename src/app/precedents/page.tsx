'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Clock, ExternalLink } from 'lucide-react'
import { Analysis, AnalysisResult } from '@/lib/database.types'

export default function PrecedentsPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAnalyses, setFilteredAnalyses] = useState<Analysis[]>([])

  useEffect(() => {
    fetchAnalyses()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = analyses.filter(analysis => 
        analysis.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.url_canonical.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredAnalyses(filtered)
    } else {
      setFilteredAnalyses(analyses)
    }
  }, [searchTerm, analyses])

  const fetchAnalyses = async () => {
    try {
      const response = await fetch('/api/analyze?limit=20')
      if (response.ok) {
        const data = await response.json()
        setAnalyses(data)
      }
    } catch (error) {
      console.error('Failed to fetch analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}min`
    }
    // Always show hours, never days
    return `${hours.toFixed(1)}h`
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recent analyses</h1>
        <p className="text-slate-600">Browse recent results from the community.</p>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search by URL..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-slate-500">Loading...</div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="text-slate-500">No analyses found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnalyses.map((analysis) => {
            const result = analysis.result as unknown as AnalysisResult
            return (
              <Card key={analysis.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">
                        <a
                          href={analysis.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline inline-flex items-center gap-1"
                        >
                          {new URL(analysis.url).hostname}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </CardTitle>
                    </div>
                    <Badge variant="outline">{analysis.tier.toUpperCase()}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{formatHours(result.total_hours)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}