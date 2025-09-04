export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const pathname = url.pathname;
    
    // パスベースのルーティング
    if (pathname === '/news' || pathname === '/news/') {
      // news.htmlを返す
      const modifiedRequest = new Request(url.origin + '/news.html', request);
      return env.ASSETS.fetch(modifiedRequest);
    }
    
    // デフォルトはindex.htmlを返す
    return env.ASSETS.fetch(request);
  }
};