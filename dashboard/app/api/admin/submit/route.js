import { NextResponse } from 'next/server'
import { constantTimeEqual } from '@/lib/utils'
import { createQueuedRequest } from '@/lib/store'
import { hasGitHubRepoConfig } from '@/lib/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    if (!hasGitHubRepoConfig()) {
      return NextResponse.json({ success: false, error: 'GitHub-backed storage is not configured on the server.' }, { status: 500 })
    }

    const form = await request.formData()
    const password = String(form.get('password') || '')
    const prompt = String(form.get('prompt') || '').trim()
    const expectedPassword = process.env.DASHBOARD_ADMIN_PASSWORD || ''

    if (!expectedPassword) {
      return NextResponse.json({ success: false, error: 'Admin password is not configured on the server.' }, { status: 500 })
    }

    if (!constantTimeEqual(password, expectedPassword)) {
      return NextResponse.json({ success: false, error: '관리자 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    if (!prompt) {
      return NextResponse.json({ success: false, error: '프롬프트를 입력해 주세요.' }, { status: 400 })
    }

    const incomingFiles = form.getAll('files').filter(Boolean)
    if (!incomingFiles.length) {
      return NextResponse.json({ success: false, error: '최소 1개 이상의 파일을 업로드해야 합니다.' }, { status: 400 })
    }

    const files = []
    for (const file of incomingFiles) {
      if (typeof file.arrayBuffer !== 'function') continue
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: `${file.name} 파일이 5MB 제한을 초과했습니다.` }, { status: 400 })
      }
      const buffer = Buffer.from(await file.arrayBuffer())
      files.push({
        name: file.name,
        size: file.size,
        type: file.type,
        buffer
      })
    }

    const queued = await createQueuedRequest({ prompt, files })
    return NextResponse.json({ success: true, data: { requestId: queued.id } })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || '알 수 없는 오류가 발생했습니다.' }, { status: 500 })
  }
}
