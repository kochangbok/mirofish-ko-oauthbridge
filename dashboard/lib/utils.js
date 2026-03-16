import crypto from 'node:crypto'

export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function isoNow() {
  return new Date().toISOString()
}

export function excerpt(text, max = 160) {
  if (!text) return ''
  const collapsed = text.replace(/\s+/g, ' ').trim()
  return collapsed.length <= max ? collapsed : `${collapsed.slice(0, max - 1)}…`
}

export function slugifyFilename(name) {
  return name
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'upload.bin'
}

export function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`
}

export function constantTimeEqual(a, b) {
  const left = Buffer.from(a || '')
  const right = Buffer.from(b || '')
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(iso))
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return new Intl.NumberFormat('ko-KR').format(Number(value))
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

export function formatDurationSeconds(seconds) {
  if (seconds == null || Number.isNaN(Number(seconds))) return '—'
  const total = Math.max(0, Math.round(Number(seconds)))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const parts = []
  if (hours) parts.push(`${hours}시간`)
  if (minutes) parts.push(`${minutes}분`)
  if (secs || !parts.length) parts.push(`${secs}초`)
  return parts.join(' ')
}

export function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

export function countBy(items, getKey) {
  const map = new Map()
  for (const item of items || []) {
    const key = getKey(item)
    if (!key) continue
    map.set(key, (map.get(key) || 0) + 1)
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ko'))
}

export function deriveProjectName(prompt) {
  const firstLine = (prompt || '').split(/\r?\n/).find(Boolean) || 'MiroFish queued simulation'
  const trimmed = firstLine.trim().slice(0, 70)
  const stamp = new Date().toISOString().slice(0, 10)
  return `${stamp} · ${trimmed}`
}
