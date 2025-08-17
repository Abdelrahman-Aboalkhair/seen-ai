import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatCurrency(amount: number, currency = 'SAR') {
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(amount)
}

export function calculateCreditsNeeded(candidateCount: number, matchThreshold: number) {
  let baseCost = candidateCount * 10
  if (matchThreshold >= 70) baseCost += candidateCount * 5
  if (matchThreshold >= 80) baseCost += candidateCount * 10
  return baseCost
}

export function calculateCVAnalysisCost(fileCount: number) {
  return fileCount * 5
}

export function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'SEEN'
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}