import fs from 'node:fs/promises'
import path from 'node:path'
import { DASHBOARD_DATA_ROOT, getRepoEnv, hasGitHubRepoConfig } from './config.js'

function githubHeaders(extra = {}) {
  const { token } = getRepoEnv()
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'mirofish-public-dashboard',
    ...extra
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function contentsUrl(filePath) {
  const { owner, repo, branch } = getRepoEnv()
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(branch)}`
}

function contentsPutUrl(filePath) {
  const { owner, repo } = getRepoEnv()
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`
}

export async function readLocalJson(relativePath, fallback = null) {
  try {
    const absolute = path.join(process.cwd(), '..', relativePath)
    const text = await fs.readFile(absolute, 'utf8')
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

export async function readLocalText(relativePath, fallback = '') {
  try {
    const absolute = path.join(process.cwd(), '..', relativePath)
    return await fs.readFile(absolute, 'utf8')
  } catch {
    return fallback
  }
}

export async function readRepoFile(relativePath, { parseJson = false, fallback = null } = {}) {
  if (!hasGitHubRepoConfig()) {
    return parseJson ? readLocalJson(relativePath, fallback) : readLocalText(relativePath, fallback ?? '')
  }

  const response = await fetch(contentsUrl(relativePath), {
    headers: githubHeaders(),
    next: { revalidate: 20 }
  })

  if (response.status === 404) return fallback
  if (!response.ok) {
    throw new Error(`GitHub read failed (${response.status}) for ${relativePath}`)
  }

  const data = await response.json()
  const text = Buffer.from(data.content || '', 'base64').toString('utf8')
  return parseJson ? JSON.parse(text) : text
}


export async function readRepoBinary(relativePath, { fallback = null } = {}) {
  if (!hasGitHubRepoConfig()) {
    try {
      const absolute = path.join(process.cwd(), '..', relativePath)
      return await fs.readFile(absolute)
    } catch {
      return fallback
    }
  }

  const response = await fetch(contentsUrl(relativePath), {
    headers: githubHeaders(),
    cache: 'no-store'
  })

  if (response.status === 404) return fallback
  if (!response.ok) {
    throw new Error(`GitHub read failed (${response.status}) for ${relativePath}`)
  }

  const data = await response.json()
  return Buffer.from(data.content || '', 'base64')
}

export async function getFileSha(relativePath) {
  const response = await fetch(contentsUrl(relativePath), { headers: githubHeaders() })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Unable to get SHA for ${relativePath}: ${response.status}`)
  const data = await response.json()
  return data.sha
}

export async function upsertRepoFile(relativePath, content, message) {
  if (!hasGitHubRepoConfig()) {
    throw new Error('GitHub repository env vars are not configured for write operations.')
  }

  const sha = await getFileSha(relativePath)
  const { branch } = getRepoEnv()
  const payload = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch
  }
  if (sha) payload.sha = sha

  const response = await fetch(contentsPutUrl(relativePath), {
    method: 'PUT',
    headers: githubHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GitHub write failed (${response.status}) for ${relativePath}: ${text}`)
  }

  return response.json()
}

export async function ensureDashboardDirectories() {
  const defaults = [
    [`${DASHBOARD_DATA_ROOT}/reports/index.json`, JSON.stringify({ updatedAt: null, items: [] }, null, 2) + '\n'],
    [`${DASHBOARD_DATA_ROOT}/requests/index.json`, JSON.stringify({ updatedAt: null, items: [] }, null, 2) + '\n']
  ]

  for (const [filePath, content] of defaults) {
    const existing = await readRepoFile(filePath, { parseJson: false, fallback: null })
    if (existing == null && hasGitHubRepoConfig()) {
      await upsertRepoFile(filePath, content, `chore(dashboard): initialize ${filePath}`)
    }
  }
}
