const API_BASE = import.meta.env.VITE_API_URL || ''

export function getAvatarUrl(url?: string): string {
  if (!url) return ''
  // External URL (DiceBear etc.) — use as-is
  if (url.startsWith('http')) return url
  // Uploaded file — relative path, prepend API base in production
  if (API_BASE) return API_BASE + url
  return url
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString + 'Z')
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`
  if (diffHour < 24) return `${diffHour} 小时前`
  if (diffDay < 7) return `${diffDay} 天前`
  if (diffDay < 365) return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}
