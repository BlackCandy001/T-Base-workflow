import { ProxyHandler } from '../../services/proxy.service';
import { proxyEvents } from '../../services/proxy-events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DeepSeek:Proxy');

// let capturedUnmaskedEmail: string | null = null;

export const DeepSeekProxy: ProxyHandler = {
  onRequest: (ctx: any, callback: () => void) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    if (host && host.includes('chat.deepseek.com')) {
      logger.debug(`[Proxy] DeepSeek Request: ${url}`);
      const auth = ctx.clientToProxyRequest.headers['authorization'];

      if (auth) {
        logger.debug(
          '[Proxy] Intercepting DeepSeek request with Authorization header',
        );
        proxyEvents.emit('deepseek-auth-header', auth);
      }
    }
    callback();
  },

  onRequestData: (
    ctx: any,
    chunk: Buffer,
    callback: (err: Error | null, data?: Buffer) => void,
  ) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    if (
      host &&
      host.includes('chat.deepseek.com') &&
      url.includes('/api/v0/users/login')
    ) {
      const bodyStr = chunk.toString();
      try {
        const outerJson = JSON.parse(bodyStr);
        let foundEmail = null;
        if (outerJson.request) {
          const innerJson = JSON.parse(outerJson.request);
          if (innerJson.email) {
            foundEmail = innerJson.email;
          }
        } else if (outerJson.email) {
          foundEmail = outerJson.email;
        }

        if (foundEmail) {
          logger.info(
            `[Proxy] Captured DeepSeek Login Email (JSON): ${foundEmail}`,
          );
          (ctx as any).capturedUnmaskedEmail = foundEmail;
          proxyEvents.emit('deepseek-login-email', { email: foundEmail });
        }
      } catch (e) {
        // Fallback to regex if JSON parsing fails, or if it's a stringified JSON body
        // Matches "email":"..." or \"email\":\"...\"
        const emailMatch = bodyStr.match(
          /\\?"email\\?":\s*\\?"([^"\\*]+)@([^"\\*]+)\\?"/,
        );
        if (emailMatch && emailMatch[0]) {
          const email = `${emailMatch[1]}@${emailMatch[2]}`.replace(/\\/g, '');
          if (!email.includes('***')) {
            logger.info(
              `[Proxy] Captured DeepSeek Login Email (Regex): ${email}`,
            );
            (ctx as any).capturedUnmaskedEmail = email;
            proxyEvents.emit('deepseek-login-email', { email });
          }
        }
      }
    }
    callback(null, chunk);
  },

  onResponseBody: (ctx: any, body: string) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    // DeepSeek Login Response (Get Token)
    if (
      host &&
      host.includes('chat.deepseek.com') &&
      url.includes('/api/v0/users/login')
    ) {
      try {
        const json = JSON.parse(body);

        let userData;

        if (json.response && typeof json.response === 'string') {
          const innerResponse = JSON.parse(json.response);
          userData = innerResponse?.data?.biz_data?.user;
        } else if (json.data && json.data.biz_data && json.data.biz_data.user) {
          userData = json.data.biz_data.user;
        } else if (json.code === 0 && json.data) {
          userData = json.data;
        }

        if (userData && userData.token) {
          logger.info(`[Proxy] Captured DeepSeek Login Token`);

          const eventPayload: any = { cookies: userData.token };

          const capturedEmail = (ctx as any).capturedUnmaskedEmail;
          // Prefer unmasked captured email, fallback to response email (which might be masked)
          let bestEmail = capturedEmail || userData.email;

          // Crucial: If bestEmail is masked, but we have a captured email, use captured one.
          // In DeepSeek login, usually if it has ***, it's from the response.
          if (bestEmail?.includes('***') && capturedEmail) {
            bestEmail = capturedEmail;
          }

          if (bestEmail) {
            logger.info(`[Proxy] Using DeepSeek Login Email: ${bestEmail}`);
            eventPayload.email = bestEmail;
            proxyEvents.emit('deepseek-login-email', { email: bestEmail });
          }

          // Emit as object with 'cookies' property to match browser-login expectations
          proxyEvents.emit('deepseek-login-token', eventPayload);

          // Clear temp storage from context is not strictly needed but good practice
          delete (ctx as any).capturedUnmaskedEmail;
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse DeepSeek Login Response:', e);
      }
    }

    // DeepSeek Google Login (Email Capture)
    if (
      host &&
      host.includes('accounts.google.com') &&
      url.includes('signin/oauth/id')
    ) {
      const emailMatch = body.match(/"oPEP7c":"([^"]+)"/);
      if (emailMatch && emailMatch[1] && !emailMatch[1].includes('***')) {
        logger.info(
          `[Proxy] Found Google Email for DeepSeek: ${emailMatch[1]}`,
        );
        (ctx as any).capturedUnmaskedEmail = emailMatch[1];
        proxyEvents.emit('deepseek-google-email', { email: emailMatch[1] });
      }
    }

    // Logic for DeepSeek User Info
    if (
      host &&
      host.includes('chat.deepseek.com') &&
      url.includes('/api/v0/users/current')
    ) {
      try {
        const userInfo = JSON.parse(body);
        logger.debug(`[Proxy] Found DeepSeek User Info`);
        if (userInfo.code === 0 && userInfo.data) {
          proxyEvents.emit('deepseek-user-info', userInfo.data);

          // Also check for token in this response, as it might be a direct login/session restore
          const bizData = userInfo.data?.biz_data;
          if (bizData) {
            if (bizData.token) {
              logger.info(
                '[Proxy] Captured DeepSeek Login Token from User Info',
              );
              const eventPayload: any = { cookies: bizData.token };

              const capturedEmail = (ctx as any).capturedUnmaskedEmail;
              let bestEmail = capturedEmail || bizData.email;

              if (bestEmail?.includes('***') && capturedEmail) {
                bestEmail = capturedEmail;
              }

              if (bestEmail) {
                eventPayload.email = bestEmail;
              }
              proxyEvents.emit('deepseek-login-token', eventPayload);
            }
            if (bizData.email) {
              proxyEvents.emit('deepseek-login-email', {
                email: bizData.email,
              });
            }
          }
        }
      } catch (e) {
        logger.error('[Proxy] Failed to parse DeepSeek User Info:', e);
      }
    }
  },
};

export default DeepSeekProxy;
