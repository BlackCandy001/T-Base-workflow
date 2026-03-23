import { loginService } from '../../services/login.service';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Kimi:API');

export const BASE_URL = 'https://kimi.moonshot.cn';

/**
 * Login to Kimi using browser with proxy interception
 */
export async function login() {
  logger.info('Starting Kimi login...');

  return await loginService.login({
    providerId: 'kimi',
    loginUrl: 'https://kimi.moonshot.cn/',
    partition: `kimi-${Date.now()}`,
    cookieEvent: 'kimi-cookies',
    validate: async (data: { cookies: string; headers?: any; email?: string }) => {
      if (data.cookies) {
        logger.info('[Kimi] Validation success with captured cookies');
        return {
          isValid: true,
          cookies: data.cookies,
          email: data.email || 'kimi@user.com',
        };
      }
      return { isValid: false };
    },
  });
}
