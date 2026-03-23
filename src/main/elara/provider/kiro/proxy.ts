import { ProxyHandler } from '../../services/proxy.service';
import { proxyEvents } from '../../services/proxy-events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Kiro:Proxy');

export const KiroProxy: ProxyHandler = {
  onRequest: (ctx: any, callback: () => void) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    if (host && (host.includes('auth.desktop.kiro.dev') || host.includes('codewhisperer.amazonaws.com'))) {
      // Capture AWS SSO auth requests
      if (host.includes('auth.desktop.kiro.dev')) {
        logger.debug('[Proxy] Intercepting Kiro AWS SSO request');
      }

      // Capture CodeWhisperer API requests
      if (host.includes('codewhisperer.amazonaws.com')) {
        logger.debug('[Proxy] Intercepting Kiro CodeWhisperer API request');
        
        // Capture authorization header
        const auth = ctx.clientToProxyRequest.headers['authorization'];
        if (auth && auth.startsWith('Bearer ')) {
          logger.debug('[Proxy] Captured Kiro Bearer token');
        }
      }

      // Capture cookies/tokens
      const reqCookies = ctx.clientToProxyRequest.headers.cookie;
      if (reqCookies && (reqCookies.includes('access_token') || reqCookies.includes('refresh_token'))) {
        logger.debug('[Proxy] Captured Kiro tokens from cookie');
        proxyEvents.emit('kiro-tokens', reqCookies);
      }
    }
    callback();
  },

  onResponseBody: (ctx: any, body: string) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    // Capture token response from AWS SSO
    if (host && host.includes('auth.desktop.kiro.dev') && url.includes('/refreshToken')) {
      try {
        const json = JSON.parse(body);
        if (json.accessToken) {
          logger.info('[Proxy] Captured Kiro access token');
          // Convert camelCase to snake_case for consistency
          proxyEvents.emit('kiro-tokens', JSON.stringify({
            accessToken: json.accessToken,
            refreshToken: json.refreshToken,
            expiresIn: json.expiresIn,
          }));
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse token response:', e);
      }
    }

    // Capture CodeWhisperer profile response
    if (host && host.includes('codewhisperer.amazonaws.com') && url.includes('ListProfiles')) {
      try {
        const json = JSON.parse(body);
        const profiles = json.profiles || [];
        if (profiles.length > 0) {
          const profile = profiles[0];
          logger.info(`[Proxy] Captured Kiro profile: ${profile.email || profile.profileArn}`);
          proxyEvents.emit('kiro-user-info', {
            email: profile.email,
            profileArn: profile.profileArn,
          });
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse profile response:', e);
      }
    }

    // Capture device authorization response
    if (host && host.includes('auth.desktop.kiro.dev') && url.includes('/authorize')) {
      try {
        const json = JSON.parse(body);
        if (json.deviceCode && json.verificationUriComplete) {
          logger.info(`[Proxy] Kiro Device Code: ${json.deviceCode.substring(0, 10)}...`);
          logger.info(`[Proxy] Kiro Verification URL: ${json.verificationUriComplete}`);
          proxyEvents.emit('kiro-device-code', json);
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse device code response:', e);
      }
    }
  },
};

export default KiroProxy;
