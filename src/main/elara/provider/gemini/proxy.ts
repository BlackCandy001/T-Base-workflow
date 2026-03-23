import { ProxyHandler } from '../../services/proxy.service';
import { proxyEvents } from '../../services/proxy-events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Gemini:Proxy');

export const GeminiProxy: ProxyHandler = {
  onRequest: (ctx: any, callback: () => void) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    if (host && (host.includes('gemini.google.com') || host.includes('google.com'))) {
      const reqCookies = ctx.clientToProxyRequest.headers.cookie;

      // Extract bl (Build Label) and f.sid from URL
      if (url.includes('bl=') || url.includes('f.sid=')) {
        try {
          const fullUrl = new URL(url, 'https://gemini.google.com');
          const bl = fullUrl.searchParams.get('bl');
          if (bl) {
            logger.debug(`[Proxy] Found Gemini Build Label (bl): ${bl}`);
            proxyEvents.emit('gemini-metadata', { bl });
          }

          const fsid = fullUrl.searchParams.get('f.sid');
          if (fsid) {
            logger.debug(`[Proxy] Found Gemini f.sid: ${fsid}`);
            proxyEvents.emit('gemini-metadata', { f_sid: fsid });
          }
        } catch (e) {
          logger.error('[Proxy] Error parsing BL/f.sid:', e);
        }
      }

      // Capture cookies with __Secure-1PSID
      if (reqCookies && reqCookies.includes('__Secure-1PSID')) {
        logger.debug('[Proxy] Found __Secure-1PSID in Gemini Request Cookie');
        proxyEvents.emit('gemini-cookies', reqCookies);
      }
    }
    callback();
  },

  onResponseBody: (ctx: any, body: string) => {
    const host = ctx.clientToProxyRequest.headers.host;

    if (host && (host.includes('gemini.google.com') || host.includes('google.com'))) {
      // Capture SNlM0e from response body
      const snlm0eMatch =
        body.match(/"SNlM0e":"([^"]+)"/) || body.match(/"SNlM0e"\,\s*"([^"]+)"/);
      if (snlm0eMatch && snlm0eMatch[1]) {
        logger.debug('[Proxy] Found SNlM0e in Gemini Response Body');
        proxyEvents.emit('gemini-metadata', { snlm0e: snlm0eMatch[1] });
      }
    }

    // Google Account Login (Email Capture)
    if (host && host.includes('accounts.google.com')) {
      // 1. Look for oPEP7c (common in oauth)
      const oPEP7cMatch = body.match(/"oPEP7c":"([^"]+)"/);
      if (oPEP7cMatch && oPEP7cMatch[1]) {
        logger.info(`[Proxy] Found Google Email (oPEP7c): ${oPEP7cMatch[1]}`);
        proxyEvents.emit('gemini-user-info', { email: oPEP7cMatch[1] });
      }

      // 2. Look for MI613e RPC call
      if (body.includes('MI613e')) {
        const emailMatch = body.match(/"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})"/);
        if (emailMatch && emailMatch[1]) {
          logger.info(`[Proxy] Found Google Email (MI613e): ${emailMatch[1]}`);
          proxyEvents.emit('gemini-user-info', { email: emailMatch[1] });
        }
      }

      // 3. Fallback for any email
      const generalEmailMatch = body.match(/[a-zA-Z0-9._%+-]+@gmail\.com/);
      if (generalEmailMatch) {
        logger.info(`[Proxy] Found Google Email (General): ${generalEmailMatch[0]}`);
        proxyEvents.emit('gemini-user-info', { email: generalEmailMatch[0] });
      }
    }

    // Google API User Info
    if (
      host &&
      host.includes('www.googleapis.com') &&
      ctx.clientToProxyRequest.url.includes('/userinfo')
    ) {
      try {
        const userInfo = JSON.parse(body);
        logger.debug('[Proxy] Found User Info in Google API Response');
        proxyEvents.emit('gemini-user-info', userInfo);
      } catch (e) {
        logger.error('[Proxy] Failed to parse User Info:', e);
      }
    }
  },
};

export default GeminiProxy;
