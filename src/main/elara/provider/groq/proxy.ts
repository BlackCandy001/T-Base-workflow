import { ProxyHandler } from '../../services/proxy.service';
import { proxyEvents } from '../../services/proxy-events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Groq:Proxy');

export const GroqProxy: ProxyHandler = {
  onRequest: (ctx: any, callback: () => void) => {
    const host = ctx.clientToProxyRequest.headers.host;

    if (host && host.includes('console.groq.com')) {
      const reqCookies = ctx.clientToProxyRequest.headers.cookie;
      if (reqCookies && reqCookies.includes('stytch_session_jwt')) {
        logger.debug('[Proxy] Captured Groq stytch_session_jwt cookie');
        proxyEvents.emit('groq-cookies', reqCookies);
      }
    }
    callback();
  },
};

export default GroqProxy;
