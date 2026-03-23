import { ProxyHandler } from '../../services/proxy.service';
import { proxyEvents } from '../../services/proxy-events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('IFlow:Proxy');

export const IFlowProxy: ProxyHandler = {
  onRequest: (ctx: any, callback: () => void) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    if (host && host.includes('iflow.cn')) {
      // Capture OAuth authorization
      if (url.includes('/oauth')) {
        logger.debug('[Proxy] Intercepting iFlow OAuth request');
      }

      // Capture API requests
      if (url.includes('/v1/')) {
        logger.debug('[Proxy] Intercepting iFlow API request');
        
        // Capture authorization header
        const auth = ctx.clientToProxyRequest.headers['authorization'];
        if (auth && auth.startsWith('Bearer ')) {
          logger.debug('[Proxy] Captured iFlow Bearer token');
        }
      }

      // Capture cookies/tokens
      const reqCookies = ctx.clientToProxyRequest.headers.cookie;
      if (reqCookies && (reqCookies.includes('access_token') || reqCookies.includes('refresh_token'))) {
        logger.debug('[Proxy] Captured iFlow tokens from cookie');
        proxyEvents.emit('iflow-tokens', reqCookies);
      }
    }
    callback();
  },

  onResponseBody: (ctx: any, body: string) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    // Capture token response
    if (host && host.includes('iflow.cn') && url.includes('/oauth/token')) {
      try {
        const json = JSON.parse(body);
        if (json.access_token) {
          logger.info('[Proxy] Captured iFlow access token');
          proxyEvents.emit('iflow-tokens', JSON.stringify(json));
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse token response:', e);
      }
    }

    // Capture user info response
    if (host && host.includes('iflow.cn') && url.includes('/user/info')) {
      try {
        const json = JSON.parse(body);
        if (json.success && json.data) {
          const userData = json.data;
          logger.info(`[Proxy] Captured iFlow user info: ${userData.email || userData.nickname}`);
          proxyEvents.emit('iflow-user-info', {
            email: userData.email,
            apiKey: userData.apiKey,
            displayName: userData.nickname || userData.name,
            phone: userData.phone,
          });
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse user info response:', e);
      }
    }

    // Capture OAuth authorization response
    if (host && host.includes('iflow.cn') && url.includes('/oauth/authorize')) {
      try {
        const json = JSON.parse(body);
        if (json.code) {
          logger.info('[Proxy] Captured iFlow authorization code');
          proxyEvents.emit('iflow-authorization-code', json.code);
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse authorization response:', e);
      }
    }
  },
};

export default IFlowProxy;
