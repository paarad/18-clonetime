import crypto from 'crypto-js'

export function normalizeUrl(url: string): string {
  try {
    const input = /^(https?:)\/\//i.test(url) ? url : `https://${url}`
    const urlObj = new URL(input)
    // Remove common tracking parameters and fragments
    const cleanUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`
    return cleanUrl.toLowerCase().replace(/\/$/, '') // Remove trailing slash
  } catch {
    throw new Error('Invalid URL')
  }
}

export function generateFingerprint(canonicalUrl: string, tier: string): string {
  return crypto.SHA256(`${canonicalUrl}:${tier}`).toString()
}

export function validateUrl(url: string): boolean {
  try {
    const input = /^(https?:)\/\//i.test(url) ? url : `https://${url}`
    new URL(input)
    return true
  } catch {
    return false
  }
}

export const TIER_OPTIONS = [
  { value: 'speedrun', label: 'Speedrun', description: 'Vibe-code prototype' },
  { value: 'mvp', label: 'MVP', description: 'Minimum viable product' },
  { value: 'prod-lite', label: 'Prod-lite', description: 'Production-ready basics' }
] as const

export type TierType = typeof TIER_OPTIONS[number]['value'] 