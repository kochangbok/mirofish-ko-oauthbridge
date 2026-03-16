"use client"

import { useState } from 'react'

export default function AdminSubmitForm() {
  const [password, setPassword] = useState('')
  const [prompt, setPrompt] = useState('')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successUrl, setSuccessUrl] = useState('')

  async function onSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccessUrl('')
    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.set('password', password)
      formData.set('prompt', prompt)
      for (const file of files) {
        formData.append('files', file)
      }

      const response = await fetch('/api/admin/submit', {
        method: 'POST',
        body: formData
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || '요청 등록에 실패했어.')
      }
      setSuccessUrl(`/requests/${payload.data.requestId}`)
      setPrompt('')
      setFiles([])
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="form-stack">
      <div className="field">
        <label htmlFor="password">관리자 비밀번호</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="files">업로드 파일</label>
        <input
          id="files"
          type="file"
          multiple
          required
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          accept=".txt,.md,.pdf,.json"
        />
        <div className="muted small">PDF, TXT, MD, JSON 업로드 가능. 파일당 최대 5MB.</div>
      </div>
      <div className="field">
        <label htmlFor="prompt">프롬프트</label>
        <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} required />
      </div>
      {error ? <div className="error-box">{error}</div> : null}
      {successUrl ? <div className="success-box">요청이 등록됐어. <a href={successUrl}>공개 상태 페이지 열기</a></div> : null}
      <button className="primary" type="submit" disabled={submitting}>{submitting ? '등록 중...' : '시뮬레이션 요청 등록'}</button>
    </form>
  )
}
