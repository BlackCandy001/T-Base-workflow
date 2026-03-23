import { ProxyHandler } from '../../services/proxy.service';
import { proxyEvents } from '../../services/proxy-events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Cerebras:Proxy');

export const CerebrasProxy: ProxyHandler = {
  onRequest: (ctx: any, callback: () => void) => {
    const host = ctx.clientToProxyRequest.headers.host;

    if (host && host.includes('chat.cerebras.ai')) {
      // Cerebras may use API key in headers
      const authorization = ctx.clientToProxyRequest.headers['authorization'];
      if (authorization && authorization.startsWith('Bearer ')) {
        const apiKey = authorization.substring(7);
        if (apiKey.startsWith('demo-')) {
          logger.debug('[Proxy] Captured Cerebras demo API key');
          proxyEvents.emit('cerebras-login-success', {
            cookies: apiKey,
            email: 'cerebras-user@elara.ai',
          });
        }
      }
    }
    callback();
  },
};

export default CerebrasProxy;
