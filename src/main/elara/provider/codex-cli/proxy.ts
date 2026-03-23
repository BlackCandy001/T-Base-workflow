import { ProxyHandler } from '../../services/proxy.service';
import { proxyEvents } from '../../services/proxy-events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CodexCLI:Proxy');

export const CodexCLIProxy: ProxyHandler = {
  onRequest: (ctx: any, callback: () => void) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    if (
      host &&
      (host.includes('auth.openai.com') || host.includes('chatgpt.com'))
    ) {
      logger.debug(`[Proxy] Codex CLI intercepting request to ${host}${url}`);
    }
    callback();
  },

  onResponseBody: (ctx: any, body: string) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    // Capture token response from auth.openai.com
    if (
      host &&
      host.includes('auth.openai.com') &&
      url.includes('/oauth/token')
    ) {
      try {
        const json = JSON.parse(body);
        if (json.access_token) {
          logger.info('[Proxy] Captured Codex CLI tokens');
          proxyEvents.emit('codex-cli-tokens', {
            cookies: JSON.stringify({
              accessToken: json.access_token,
              refreshToken: json.refresh_token || '',
              expiresIn: json.expires_in || 86400,
            }),
          });
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse Codex token response:', e);
      }
    }

    // Capture user info from usage endpoint
    if (
      host &&
      host.includes('chatgpt.com') &&
      url.includes('/backend-api/wham/usage')
    ) {
      try {
        const json = JSON.parse(body);
        if (json.email) {
          logger.info(`[Proxy] Captured Codex CLI email: ${json.email}`);
          proxyEvents.emit('codex-cli-user-info', json);
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse Codex usage response:', e);
      }
    }
  },
};

export default CodexCLIProxy;
