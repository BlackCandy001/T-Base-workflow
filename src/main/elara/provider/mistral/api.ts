import { loginService } from '../../services/login.service';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Mistral:API');

export const BASE_URL = 'https://console.mistral.ai';

/**
 * Login to Mistral using browser with proxy interception
 */
export async function login() {
  logger.info('Starting Mistral login...');

  return await loginService.login({
    providerId: 'mistral',
    loginUrl: 'https://auth.mistral.ai/ui/login',
    partition: `mistral-${Date.now()}`,
    cookieEvent: 'mistral-cookies',
    validate: async (data: { cookies: string; headers?: any; email?: string }) => {
      if (data.cookies && data.cookies.length > 0) {
        const email = await fetchMistralProfile(data.cookies);
        if (email) {
          logger.info(`[Mistral] Validation success for email: ${email}`);
          return { isValid: true, email, cookies: data.cookies };
        }
      }
      return { isValid: false };
    },
  });
}

/**
 * Fetch Mistral user profile
 */
export async function fetchMistralProfile(cookies: string): Promise<string | null> {
  try {
    const response = await fetch('https://console.mistral.ai/api/users/me', {
      method: 'GET',
      headers: {
        Cookie: cookies,
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        accept: 'application/json',
      },
    });

    if (response.status === 200) {
      const json = await response.json();
      if (json.email) {
        return json.email;
      }
    }
    return null;
  } catch (e) {
    logger.error('[Mistral] Get Profile Error:', e);
    return null;
  }
}
