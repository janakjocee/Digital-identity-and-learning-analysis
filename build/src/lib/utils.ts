/**
 * Utility Functions
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  });
}

/**
 * Format time from seconds
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Get grade color based on score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Get grade label based on score
 */
export function getGradeLabel(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Get risk level color
 */
export function getRiskColor(level: string): string {
  switch (level) {
    case 'low':
      return 'text-green-500 bg-green-500/10';
    case 'medium':
      return 'text-yellow-500 bg-yellow-500/10';
    case 'high':
      return 'text-orange-500 bg-orange-500/10';
    case 'critical':
      return 'text-red-500 bg-red-500/10';
    default:
      return 'text-gray-500 bg-gray-500/10';
  }
}

/**
 * Get learning cluster label
 */
export function getClusterLabel(cluster: string): string {
  const labels: Record<string, string> = {
    'high_performer': 'High Performer',
    'consistent_learner': 'Consistent Learner',
    'irregular_learner': 'Irregular Learner',
    'at_risk': 'At Risk',
    'new': 'New Student'
  };
  return labels[cluster] || cluster;
}

/**
 * Get cluster color
 */
export function getClusterColor(cluster: string): string {
  const colors: Record<string, string> = {
    'high_performer': 'text-green-500 bg-green-500/10 border-green-500/20',
    'consistent_learner': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    'irregular_learner': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    'at_risk': 'text-red-500 bg-red-500/10 border-red-500/20',
    'new': 'text-purple-500 bg-purple-500/10 border-purple-500/20'
  };
  return colors[cluster] || 'text-gray-500 bg-gray-500/10';
}

/**
 * Truncate text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}