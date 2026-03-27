/**
 * nianming_nav Cloudflare Worker
 * 处理静态资源和同步 API
 */

const SYNC_PASSWORD = typeof SYNC_PASSWORD !== 'undefined' ? SYNC_PASSWORD : ''
const NAV_KV = typeof NAV_KV !== 'undefined' ? NAV_KV : null

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

async function handleSync(request) {
  if (!NAV_KV) {
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
      const data = await NAV_KV.get('nav_data', { type: 'json' })
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
      await NAV_KV.put('nav_data', JSON.stringify(data))
      return jsonResponse({ success: true, updatedAt: Date.now() })
    } catch (error) {
      return errorResponse('Failed to save data', 500)
    }
  }

  if (request.method === 'DELETE') {
    try {
      await NAV_KV.delete('nav_data')
      return jsonResponse({ success: true })
    } catch (error) {
      return errorResponse('Failed to delete data', 500)
    }
  }

  return errorResponse('Method not allowed', 405)
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // Handle sync API
    if (url.pathname === '/api/sync') {
      return handleSync(request)
    }

    // Serve static assets from KV
    const asset = await env.__STATIC_CONTENT?.get(url.pathname.slice(1) || 'index.html')
    if (asset) {
      const contentType = url.pathname.endsWith('.js') 
        ? 'application/javascript'
        : url.pathname.endsWith('.css')
        ? 'text/css'
        : url.pathname.endsWith('.html')
        ? 'text/html'
        : 'application/octet-stream'
      
      return new Response(asset, {
        headers: { 'Content-Type': contentType }
      })
    }

    // SPA fallback to index.html
    const indexHtml = await env.__STATIC_CONTENT?.get('index.html')
    if (indexHtml) {
      return new Response(indexHtml, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    return new Response('Not Found', { status: 404 })
  }
}
