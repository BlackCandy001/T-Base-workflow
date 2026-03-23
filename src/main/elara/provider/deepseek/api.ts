import { loginService } from '../../services/login.service';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DeepSeek:API');

export const BASE_URL = 'https://chat.deepseek.com';

/**
 * Login to DeepSeek using browser with proxy interception
 */
export async function login(options?: { deepseekMethod?: 'basic' | 'google' }) {
  const method = options?.deepseekMethod || 'basic';
  const loginUrl =
    method === 'google'
      ? 'https://accounts.google.com/ServiceLogin?service=lso&passive=1209600&continue=https://chat.deepseek.com/login'
      : 'https://chat.deepseek.com/login';

  logger.info(`Starting DeepSeek login with method: ${method}`);

  return await loginService.login({
    providerId: 'deepseek',
    loginUrl,
    partition: `deepseek-${Date.now()}`,
    cookieEvent: 'deepseek-login-token',
    infoEvent: 'deepseek-login-email',
    validate: async (data: {
      cookies: string;
      headers?: any;
      email?: string;
    }) => {
      // If we got a token from proxy event (it comes as 'cookies' from browser-login)
      if (data.cookies) {
        logger.info('[DeepSeek] Validating with captured token');
        const token = data.cookies;

        // Prioritize email captured by proxy
        let email = data.email;

        if (!email) {
          logger.info('[DeepSeek] Email not captured directly, fetching profile...');
          const profile = await getProfile(token);
          email = profile.email || undefined;
        }

        if (email) {
          // Return token as 'cookies' string to satisfy interface and ensure it gets passed back
          logger.info(`[DeepSeek] Validation success for email: ${email}`);
          return { isValid: true, cookies: token, email };
        }
      }
      return { isValid: false };
    },
  });
}

/**
 * Get user profile from DeepSeek API
 */
export async function getProfile(
  token: string,
): Promise<{ email: string | null; name?: string; id?: string }> {
  try {
    const url = `${BASE_URL}/api/v0/users/current`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: BASE_URL,
        Referer: `${BASE_URL}/`,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (response.status === 200 || response.ok) {
      const json = await response.json();
      if (json.code === 0 && json.data) {
        return {
          email: json.data.email || 'deepseek@user.com',
          name: json.data.name,
          id: json.data.id,
        };
      }
    }
    return { email: null };
  } catch (e) {
    logger.error('[DeepSeek] Get Profile Error:', e);
    return { email: null };
  }
}
