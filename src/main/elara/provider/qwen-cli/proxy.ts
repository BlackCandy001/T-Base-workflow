import { ProxyHandler } from '../../services/proxy.service';
import { proxyEvents } from '../../services/proxy-events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('QwenCLI:Proxy');

export const QwenCLIProxy: ProxyHandler = {
  onRequest: (ctx: any, callback: () => void) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    if (host && host.includes('chat.qwen.ai')) {
      logger.info(`[Proxy] Intercepted request to ${host}${url}`);
    }
    callback();
  },

  onResponseBody: (ctx: any, body: string) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    if (host && host.includes('chat.qwen.ai')) {
      logger.info(
        `[Proxy] Response from ${host}${url}: ${body.substring(0, 200)}...`,
      );

      // Capture device code response
      if (url.includes('/api/v1/oauth2/device/code')) {
        try {
          const json = JSON.parse(body);
          if (json.device_code && json.verification_uri_complete) {
            logger.info(
              `[Proxy] Qwen CLI Device Code: ${json.device_code.substring(0, 10)}...`,
            );
            proxyEvents.emit('qwen-cli-device-code', json);
          }
        } catch (e) {
          logger.error('[Proxy] Failed to parse device code response:', e);
        }
      }

      // Capture token response
      if (url.includes('/api/v1/oauth2/token')) {
        try {
          const json = JSON.parse(body);
          let tokenData = json;

          // Handle wrapped response as seen in some Qwen CLI versions
          if (
            json.response &&
            typeof json.response === 'string' &&
            json.response.startsWith('{')
          ) {
            try {
              tokenData = JSON.parse(json.response);
              logger.debug(
                '[Proxy] Parsed wrapped token response from body.response',
              );
            } catch (e) {
              logger.warn(
                '[Proxy] Failed to parse wrapped response field, using raw body',
              );
            }
          }

          if (tokenData.access_token) {
            logger.info(
              '[Proxy] Captured Qwen CLI tokens from /token response',
            );
            proxyEvents.emit('qwen-cli-tokens', {
              cookies: JSON.stringify({
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token || '',
                expiresIn: tokenData.expires_in || 3600,
              }),
            });
          }
        } catch (e) {
          logger.error('[Proxy] Failed to parse token response:', e);
        }
      }

      // Capture user info (Only for email)
      if (url.includes('/api/v1/user')) {
        try {
          const json = JSON.parse(body);
          if (json.data?.email) {
            logger.info(
              `[Proxy] Captured Qwen CLI user email: ${json.data.email}`,
            );
            proxyEvents.emit('qwen-cli-user-info', json.data);
          } else if (json.email) {
            logger.info(`[Proxy] Captured Qwen CLI user email: ${json.email}`);
            proxyEvents.emit('qwen-cli-user-info', json);
          }
        } catch (e) {
          logger.error('[Proxy] Failed to parse user info:', e);
        }
      }

      // Capture auths response (Only for email)
      if (url.includes('/api/v1/auths')) {
        try {
          const json = JSON.parse(body);
          let authData = json;
          if (
            json.response &&
            typeof json.response === 'string' &&
            json.response.startsWith('{')
          ) {
            try {
              authData = JSON.parse(json.response);
            } catch (e) {}
          }

          const email = authData.email || authData.data?.email;

          if (email) {
            logger.info(
              `[Proxy] Captured Qwen CLI email from /auths: ${email}`,
            );
            proxyEvents.emit('qwen-cli-user-info', { email });
          }
        } catch (e) {
          logger.error('[Proxy] Failed to parse auths response:', e);
        }
      }
    }
  },
};

export default QwenCLIProxy;
