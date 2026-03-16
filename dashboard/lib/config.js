export const DASHBOARD_DATA_ROOT = 'dashboard-data'
export const REPORTS_INDEX_PATH = `${DASHBOARD_DATA_ROOT}/reports/index.json`
export const REQUESTS_INDEX_PATH = `${DASHBOARD_DATA_ROOT}/requests/index.json`
export const DASHBOARD_BRANCH = process.env.DASHBOARD_BRANCH || 'dashboard-data'

export function getRepoEnv() {
  return {
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    token: process.env.GITHUB_TOKEN,
    branch: DASHBOARD_BRANCH
  }
}

export function hasGitHubRepoConfig() {
  const { owner, repo, token } = getRepoEnv()
  return Boolean(owner && repo && token)
}
