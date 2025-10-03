export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // CORSヘッダーを設定する関数
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-client-fingerprint',
      'Access-Control-Max-Age': '86400'
    };
    
    // CORSプリフライトリクエストの処理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    // APIプロキシ - /api/で始まるパスを外部APIに転送
    if (pathname.startsWith('/api/')) {
      // ターゲットURLを構築
      const apiUrl = `https://news-images-worker.news-images-247.workers.dev${pathname}${url.search}`;
      
      try {
        // リクエストヘッダーをコピー
        const requestHeaders = new Headers();
        
        // 必要なヘッダーを転送
        const headersToForward = [
          'content-type',
          'authorization',
          'x-api-key',
          'x-client-fingerprint',
          'accept'
        ];
        
        for (const header of headersToForward) {
          const value = request.headers.get(header);
          if (value) {
            requestHeaders.set(header, value);
          }
        }
        
        // Origin ヘッダーを設定
        requestHeaders.set('Origin', 'https://news-images-worker.news-images-247.workers.dev');
        
        // リクエストボディを取得
        let requestBody = undefined;
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          const contentType = request.headers.get('content-type') || '';
          
          if (contentType.includes('application/json')) {
            // JSONの場合はテキストとして取得
            requestBody = await request.text();
          } else if (contentType.includes('multipart/form-data')) {
            // multipart/form-dataの場合はそのまま転送
            requestBody = await request.arrayBuffer();
          } else {
            // その他の場合もテキストとして取得
            requestBody = await request.text();
          }
        }
        
        // APIリクエストを送信
        const apiResponse = await fetch(apiUrl, {
          method: request.method,
          headers: requestHeaders,
          body: requestBody
        });
        
        // レスポンスを取得
        const responseBody = await apiResponse.text();
        
        // レスポンスヘッダーを設定
        const responseHeaders = new Headers(apiResponse.headers);
        
        // CORSヘッダーを追加
        Object.entries(corsHeaders).forEach(([key, value]) => {
          responseHeaders.set(key, value);
        });
        
        // Content-Typeが設定されていない場合はJSONとして設定
        if (!responseHeaders.has('content-type') && responseBody) {
          try {
            JSON.parse(responseBody);
            responseHeaders.set('content-type', 'application/json');
          } catch {
            // JSONでない場合は何もしない
          }
        }
        
        return new Response(responseBody, {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          headers: responseHeaders
        });
        
      } catch (error) {
        console.error('API proxy error:', error);
        console.error('Request URL:', apiUrl);
        console.error('Request method:', request.method);
        console.error('Request headers:', Object.fromEntries(request.headers.entries()));
        
        // エラーレスポンスを返す
        const errorResponse = {
          error: 'Proxy Error',
          message: error.message,
          details: {
            url: apiUrl,
            method: request.method
          }
        };
        
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }
    
    // ニュースページのルーティング
    if (pathname === '/news' || pathname === '/news/') {
      const modifiedRequest = new Request(url.origin + '/news.html', request);
      return env.ASSETS.fetch(modifiedRequest);
    }
    
    // 管理画面のルーティング（必要に応じて追加）
    if (pathname === '/admin' || pathname === '/admin/') {
      const modifiedRequest = new Request(url.origin + '/index.html', request);
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