import { ProxyHandler } from '../../services/proxy.service';
import { proxyEvents } from '../../services/proxy-events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Kimi:Proxy');

export const KimiProxy: ProxyHandler = {
  onRequest: (ctx: any, callback: () => void) => {
    const host = ctx.clientToProxyRequest.headers.host;

    if (host && host.includes('kimi.moonshot.cn')) {
      const reqCookies = ctx.clientToProxyRequest.headers.cookie;
      if (reqCookies && reqCookies.length > 0) {
        logger.debug('[Proxy] Captured Kimi cookies');
        proxyEvents.emit('kimi-cookies', reqCookies);
      }
    }
    callback();
  },
};

export default KimiProxy;
