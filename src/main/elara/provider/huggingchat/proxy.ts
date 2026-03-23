import { ProxyHandler } from '../../services/proxy.service';
import { proxyEvents } from '../../services/proxy-events';
import { createLogger } from '../../utils/logger';

const logger = createLogger('HuggingChat:Proxy');

export const HuggingChatProxy: ProxyHandler = {
  onRequest: (ctx: any, callback: () => void) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    if (host && host.includes('huggingface.co')) {
      const reqCookies = ctx.clientToProxyRequest.headers.cookie;
      if (reqCookies && reqCookies.includes('token')) {
        logger.debug('[Proxy] Captured HuggingFace token cookie');
        proxyEvents.emit('hugging-chat-cookies', reqCookies);
      }

      // Capture email from login form POST
      if (url.includes('/chat/login') && ctx.clientToProxyRequest.method === 'POST') {
        logger.debug('[Proxy] Intercepting HuggingChat login POST');
      }
    }
    callback();
  },

  onResponseBody: (ctx: any, body: string) => {
    const host = ctx.clientToProxyRequest.headers.host;
    const url = ctx.clientToProxyRequest.url;

    // Capture email from login response
    if (host && host.includes('huggingface.co') && url.includes('/chat/login')) {
      try {
        const json = JSON.parse(body);
        if (json.email) {
          logger.info(`[Proxy] Captured HuggingChat email: ${json.email}`);
          proxyEvents.emit('hugging-chat-login-data', json.email);
        }
      } catch (e) {
        // Try regex fallback
        const emailMatch = body.match(/"email":"([^"]+)"/);
        if (emailMatch && emailMatch[1]) {
          logger.info(`[Proxy] Captured HuggingChat email (regex): ${emailMatch[1]}`);
          proxyEvents.emit('hugging-chat-login-data', emailMatch[1]);
        }
      }
    }
  },
};

export default HuggingChatProxy;
