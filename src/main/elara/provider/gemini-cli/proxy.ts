import { ProxyHandler } from '../../services/proxy.service';
import { proxyEvents } from '../../services/proxy-events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('GeminiCLI:Proxy');

export const GeminiCLIProxy: ProxyHandler = {
  onRequest: (ctx: any, callback: () => void) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    if (host && (host.includes('accounts.google.com') || host.includes('cloudcode-pa.googleapis.com'))) {
      // Capture OAuth authorization
      if (host.includes('accounts.google.com') && url.includes('/o/oauth2/auth')) {
        logger.debug('[Proxy] Intercepting Gemini CLI OAuth authorization');
      }

      // Capture token exchange
      if (host.includes('oauth2.googleapis.com') && url.includes('/token')) {
        logger.debug('[Proxy] Intercepting Gemini CLI token exchange');
      }

      // Capture Cloud Code Assist requests
      if (host.includes('cloudcode-pa.googleapis.com')) {
        logger.debug('[Proxy] Intercepting Gemini CLI Cloud Code API request');
      }

      // Capture cookies/tokens
      const reqCookies = ctx.clientToProxyRequest.headers.cookie;
      if (reqCookies && (reqCookies.includes('ACCESS_TOKEN') || reqCookies.includes('REFRESH_TOKEN'))) {
        logger.debug('[Proxy] Captured Gemini CLI tokens from cookie');
        proxyEvents.emit('gemini-cli-tokens', reqCookies);
      }
    }
    callback();
  },

  onResponseBody: (ctx: any, body: string) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    // Capture token response
    if (host && host.includes('oauth2.googleapis.com') && url.includes('/token')) {
      try {
        const json = JSON.parse(body);
        if (json.access_token) {
          logger.info('[Proxy] Captured Gemini CLI access token');
          proxyEvents.emit('gemini-cli-tokens', JSON.stringify(json));
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse token response:', e);
      }
    }

    // Capture Cloud Code Assist response (project ID)
    if (host && host.includes('cloudcode-pa.googleapis.com') && url.includes(':loadCodeAssist')) {
      try {
        const json = JSON.parse(body);
        if (json.cloudaicompanionProject) {
          const projectId = typeof json.cloudaicompanionProject === 'string'
            ? json.cloudaicompanionProject
            : json.cloudaicompanionProject.id;
          logger.info(`[Proxy] Captured Gemini CLI project ID: ${projectId}`);
          proxyEvents.emit('gemini-cli-user-info', { projectId });
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse Cloud Code Assist response:', e);
      }
    }

    // Capture Google user info
    if (host && host.includes('www.googleapis.com') && url.includes('/oauth2/v2/userinfo')) {
      try {
        const json = JSON.parse(body);
        if (json.email) {
          logger.info(`[Proxy] Captured Gemini CLI user email: ${json.email}`);
          proxyEvents.emit('gemini-cli-user-info', { email: json.email, name: json.name });
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse user info:', e);
      }
    }
  },
};

export default GeminiCLIProxy;
