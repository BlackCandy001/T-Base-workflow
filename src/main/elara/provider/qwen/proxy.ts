import { ProxyHandler } from '../../services/proxy.service';
import { proxyEvents } from '../../services/proxy-events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Qwen:Proxy');

export const QwenProxy: ProxyHandler = {
  onRequest: (ctx: any, callback: () => void) => {
    const host = ctx.clientToProxyRequest.headers.host;

    if (host && host.includes('chat.qwen.ai')) {
      const reqCookies = ctx.clientToProxyRequest.headers.cookie;
      if (reqCookies && reqCookies.includes('csrfToken')) {
        logger.debug('[Proxy] Captured Qwen csrfToken cookie');
        proxyEvents.emit('qwen-cookies', reqCookies);
      }

      // Capture special headers
      const bxUa = ctx.clientToProxyRequest.headers['bx-ua'];
      const xCsrfToken = ctx.clientToProxyRequest.headers['x-csrf-token'];
      const userAgent = ctx.clientToProxyRequest.headers['user-agent'];

      if (bxUa || xCsrfToken) {
        const headers: Record<string, string> = {};
        if (bxUa) headers['bx-ua'] = bxUa;
        if (xCsrfToken) headers['x-csrf-token'] = xCsrfToken;
        if (userAgent) headers['User-Agent'] = userAgent;

        logger.debug('[Proxy] Captured Qwen headers:', headers);
        proxyEvents.emit('qwen-headers', headers);
      }
    }
    callback();
  },
};

export default QwenProxy;
