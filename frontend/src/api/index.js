import axios from 'axios'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
  timeout: 300000, // 5分钟超时（本体生成可能需要较长时间）
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    return config
  },
  error => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器（容错重试机制）
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 如果返回的状态码不是success，则抛出错误
    if (!res.success && res.success !== undefined) {
      console.error('API Error:', res.error || res.message || 'Unknown error')
      return Promise.reject(new Error(res.error || res.message || 'Error'))
    }
    
    return res
  },
  error => {
    console.error('Response error:', error)
    
    // 处理超时
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error('Request timeout')
    }
    
    // 处理网络错误
    if (error.message === 'Network Error') {
      console.error('Network error - backend or local bridge may be unavailable')
      error.message = 'Network Error: backend(http://localhost:5001) 또는 local bridge(http://127.0.0.1:8787)가 실행 중인지 확인하세요.'
    }
    
    return Promise.reject(error)
  }
)

// 带重试的请求函数
export const requestWithRetry = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      console.warn(`Request failed, retrying (${i + 1}/${maxRetries})...`)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
}

const normalizeBridgeHealth = (health = {}) => {
  const provider = health.provider || health.defaultProvider || 'codex'
  const providerAvailable = Boolean(
    health.providerAvailable ?? health.cliAvailable ?? health.codexAvailable
  )

  return {
    ...health,
    provider,
    busy: Boolean(health.busy),
    queueDepth: Number.isFinite(health.queueDepth) ? health.queueDepth : 0,
    providerAvailable,
    codexAvailable: Boolean(
      health.codexAvailable ?? (provider === 'codex' ? providerAvailable : false)
    )
  }
}

export const getBridgeHealth = async () => {
  const response = await service({
    url: '/api/system/bridge-health',
    method: 'get',
    timeout: 3000,
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
  return normalizeBridgeHealth(response)
}

export default service
