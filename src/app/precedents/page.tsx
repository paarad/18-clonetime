'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Clock, ExternalLink, TrendingUp } from 'lucide-react'
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
    if (hours < 8) {
      return `${hours.toFixed(1)}h`
    }
    const days = Math.floor(hours / 8)
    const remainingHours = hours % 8
    if (remainingHours === 0) {
      return `${days}d`
    }
    return `${days}d ${remainingHours.toFixed(1)}h`
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'speedrun': return 'bg-green-100 text-green-800'
      case 'mvp': return 'bg-blue-100 text-blue-800'
      case 'prod-lite': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const groupedAnalyses = filteredAnalyses.reduce((acc, analysis) => {
    const domain = new URL(analysis.url).hostname
    if (!acc[domain]) {
      acc[domain] = []
    }
    acc[domain].push(analysis)
    return acc
  }, {} as Record<string, Analysis[]>)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">Loading precedents...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Analysis Precedents
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Explore build time estimates for popular products. See how long it would take 
          to clone your favorite apps and tools.
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search by product name or URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Analyses</p>
                <p className="text-2xl font-bold">{analyses.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Build Time</p>
                <p className="text-2xl font-bold">
                  {analyses.length > 0 
                    ? formatHours(
                        analyses.reduce((sum, a) => sum + (a.result as unknown as AnalysisResult).total_hours, 0) / analyses.length
                      )
                    : '0h'
                  }
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Products Analyzed</p>
                <p className="text-2xl font-bold">{Object.keys(groupedAnalyses).length}</p>
              </div>
              <ExternalLink className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Grid */}
      <div className="space-y-6">
        {Object.entries(groupedAnalyses).map(([domain, domainAnalyses]) => (
          <Card key={domain}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">{domain}</span>
                <Badge variant="outline">{domainAnalyses.length} analysis{domainAnalyses.length > 1 ? 'es' : ''}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {domainAnalyses.map((analysis) => {
                  const result = analysis.result as unknown as AnalysisResult
                  return (
                    <div 
                      key={analysis.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Badge className={getTierColor(analysis.tier)}>
                            {analysis.tier}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            {formatHours(result.total_hours)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <a 
                          href={analysis.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {analysis.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        
                        <div className="text-xs text-slate-600">
                          {result.missions.length} missions • {result.product_map.roles.length} user roles
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {result.missions.slice(0, 3).map((mission, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {mission.category}
                            </Badge>
                          ))}
                          {result.missions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{result.missions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAnalyses.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">
            {searchTerm ? 'No analyses found for your search.' : 'No precedents available yet.'}
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Create First Analysis
          </Button>
        </div>
      )}
    </div>
  )
} 