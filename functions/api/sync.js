/**
 * Cloudflare Pages Functions - Sync API
 * 处理数据同步请求
 */

const SYNC_PASSWORD = typeof SYNC_PASSWORD !== 'undefined' ? SYNC_PASSWORD : ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Sync-Password',
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  })
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status)
}

export async function onRequest(context) {
  const { request, env } = context
  
  if (!env.NAV_KV) {
    return errorResponse('KV namespace not configured', 500)
  }

  const password = request.headers.get('X-Sync-Password')
  
  if (SYNC_PASSWORD && password !== SYNC_PASSWORD) {
    return errorResponse('Invalid password', 401)
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (request.method === 'GET') {
    try {
      const data = await env.NAV_KV.get('nav_data', { type: 'json' })
      if (!data) {
        return jsonResponse({ 
          links: [], 
          categories: [], 
          settings: {},
          searchConfig: {}
        })
      }
      return jsonResponse(data)
    } catch (error) {
      return errorResponse('Failed to read data', 500)
    }
  }

  if (request.method === 'PUT') {
    try {
      const data = await request.json()
      await env.NAV_KV.put('nav_data', JSON.stringify(data))
      return jsonResponse({ success: true, updatedAt: Date.now() })
    } catch (error) {
      return errorResponse('Failed to save data', 500)
    }
  }

  if (request.method === 'DELETE') {
    try {
      await env.NAV_KV.delete('nav_data')
      return jsonResponse({ success: true })
    } catch (error) {
      return errorResponse('Failed to delete data', 500)
    }
  }

  return errorResponse('Method not allowed', 405)
}
