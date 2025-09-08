'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Clock, Users, Database, ExternalLink, Star } from 'lucide-react'
import { AnalysisResult } from '@/lib/database.types'
import { TierType } from '@/lib/analysis'

interface AnalysisDisplayProps {
  analysis: AnalysisResult
  url: string
  tier: TierType
}

export default function AnalysisDisplay({ analysis, url, tier }: AnalysisDisplayProps) {
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                {formatHours(analysis.total_hours)}
              </CardTitle>
              <CardDescription className="text-lg mt-1">
                Estimated build time for{' '}
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  {new URL(url).hostname}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </CardDescription>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                {tier.toUpperCase()}
              </Badge>
              <div className={`text-sm font-medium ${getConfidenceColor(analysis.confidence)}`}>
                <Star className="w-4 h-4 inline mr-1" />
                {getConfidenceLabel(analysis.confidence)} Confidence
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Missions Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Build Missions</CardTitle>
          <CardDescription>
            Core development tasks and time estimates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.missions.map((mission, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="secondary">{mission.category}</Badge>
                    <h4 className="font-medium">{mission.title}</h4>
                  </div>
                  <Progress 
                    value={mission.confidence * 100} 
                    className="w-full h-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {getConfidenceLabel(mission.confidence)} confidence
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-semibold">
                    {formatHours(mission.hours)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {((mission.hours / analysis.total_hours) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Roles & Objects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Roles</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.product_map.roles.map((role, index) => (
                  <Badge key={index} variant="outline">{role}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Data Objects</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.product_map.objects.map((object, index) => (
                  <Badge key={index} variant="outline">{object}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              User Stories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.product_map.stories.map((story, index) => (
                <div key={index} className="text-sm p-2 bg-slate-50 rounded">
                  As a <span className="font-medium">{story.role}</span>, I can{' '}
                  <span className="font-medium">{story.i_can}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evidence */}
      {analysis.evidence && analysis.evidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evidence & Insights</CardTitle>
            <CardDescription>
              Key findings from the website analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.evidence.map((evidence, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <div className="text-sm text-slate-600 mb-1">
                    <a 
                      href={evidence.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline inline-flex items-center gap-1"
                    >
                      {new URL(evidence.url).pathname || '/'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-sm">{evidence.snippet}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scope & Assumptions */}
      <Card>
        <CardHeader>
          <CardTitle>Scope & Assumptions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">{analysis.scope}</p>
        </CardContent>
      </Card>
    </div>
  )
} 