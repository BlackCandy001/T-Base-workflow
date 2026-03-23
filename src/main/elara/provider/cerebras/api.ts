import { loginService } from '../../services/login.service';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Cerebras:API');

export const BASE_URL = 'https://chat.cerebras.ai';

/**
 * Login to Cerebras using browser with proxy interception
 * Cerebras uses a demo API key approach
 */
export async function login() {
  logger.info('Starting Cerebras login...');

  return await loginService.login({
    providerId: 'cerebras',
    loginUrl: 'https://chat.cerebras.ai/',
    partition: `cerebras-${Date.now()}`,
    cookieEvent: 'cerebras-login-success',
    validate: async (data: { cookies: string; email?: string }) => {
      // Cerebras proxy emits demoApiKey as 'cookies'
      if (data.cookies && data.cookies.startsWith('demo-')) {
        logger.info('[Cerebras] Validation success with demo API key');
        return {
          isValid: true,
          email: data.email || 'cerebras-user@elara.ai',
          cookies: data.cookies,
        };
      }
      logger.debug('[Cerebras] Waiting for demo API key...');
      return { isValid: false };
    },
  });
}
