import { loginService } from '../../services/login.service';
import { createLogger } from '../../utils/logger';
import { proxyEvents } from '../../services/proxy-events';

const logger = createLogger('Qwen:API');

export const BASE_URL = 'https://chat.qwen.ai';

/**
 * Login to Qwen using browser with proxy interception
 * Qwen requires cookies AND specific headers (bx-ua, x-csrf-token)
 */
export async function login() {
  logger.info('Starting Qwen login...');

  let capturedHeaders: Record<string, string> = {};

  const onHeaders = (headers: Record<string, string>) => {
    capturedHeaders = { ...capturedHeaders, ...headers };
    logger.debug('[Qwen] Captured headers:', headers);
  };

  proxyEvents.on('qwen-headers', onHeaders);

  try {
    return await loginService.login({
      providerId: 'qwen',
      loginUrl: 'https://chat.qwen.ai/auth',
      partition: `qwen-${Date.now()}`,
      cookieEvent: 'qwen-cookies',
      extraEvents: ['qwen-headers'],
      validate: async (data: { cookies: string; headers?: any; email?: string }) => {
        if (!data.cookies) return { isValid: false };

        const hasBxUa = capturedHeaders['bx-ua'];
        if (!hasBxUa) {
          logger.debug('[Qwen] Waiting for bx-ua header...');
          return { isValid: false };
        }

        // Process CSRF if missing
        if (!capturedHeaders['x-csrf-token']) {
          const csrfMatch = data.cookies.match(/csrfToken=([^;]+)/);
          if (csrfMatch) {
            capturedHeaders['x-csrf-token'] = csrfMatch[1];
            logger.debug('[Qwen] Extracted CSRF token from cookies');
          }
        }

        // Fetch profile for email
        let email = data.email || 'qwen@user.com';
        try {
          const res = await fetch('https://chat.qwen.ai/api/v1/account', {
            headers: {
              Cookie: data.cookies,
              'User-Agent':
                capturedHeaders['User-Agent'] ||
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
              'bx-ua': capturedHeaders['bx-ua'] || '',
              'x-csrf-token': capturedHeaders['x-csrf-token'] || '',
              accept: 'application/json',
            },
          });

          if (res.ok) {
            const json = await res.json();
            if (json.data?.email) {
              email = json.data.email;
              logger.info(`[Qwen] Fetched email from profile: ${email}`);
            }
          }
        } catch (e) {
          logger.warn('[Qwen] Failed to fetch profile:', e);
        }

        logger.info(`[Qwen] Validation success for email: ${email}`);
        return {
          isValid: true,
          cookies: data.cookies,
          email,
          headers: capturedHeaders,
        };
      },
    });
  } finally {
    proxyEvents.off('qwen-headers', onHeaders);
  }
}
