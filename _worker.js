export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // CORSプリフライトリクエストの処理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-client-fingerprint',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
    
    // APIプロキシ - /api/で始まるパスを外部APIに転送
    if (pathname.startsWith('/api/')) {
      const apiUrl = `https://news-images-worker.news-images-247.workers.dev${pathname}${url.search}`;
      
      try {
        // 元のリクエストヘッダーを取得
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('Origin', 'https://news-images-worker.news-images-247.workers.dev');
        
        const apiResponse = await fetch(apiUrl, {
          method: request.method,
          headers: requestHeaders,
          body: request.method !== 'GET' && request.method !== 'HEAD' 
            ? await request.text() 
            : undefined
        });
        
        const responseBody = await apiResponse.text();
        
        // レスポンスヘッダーを設定
        const responseHeaders = new Headers(apiResponse.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, x-client-fingerprint');
        
        return new Response(responseBody, {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          headers: responseHeaders
        });
      } catch (error) {
        console.error('API proxy error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // ニュースページのルーティング
    if (pathname === '/news' || pathname === '/news/') {
      const modifiedRequest = new Request(url.origin + '/news.html', request);
      return env.ASSETS.fetch(modifiedRequest);
    }
    
    // favicon.icoのダミー対応
    if (pathname === '/favicon.ico') {
      return new Response(null, { status: 204 });
    }
    
    // デフォルトのアセット処理
    return env.ASSETS.fetch(request);
  }
};