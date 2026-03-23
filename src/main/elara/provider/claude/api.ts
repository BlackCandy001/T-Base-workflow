import { loginService } from '../../services/login.service';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Claude:API');

export const BASE_URL = 'https://claude.ai';

/**
 * Login to Claude using browser with proxy interception
 */
export async function login() {
  logger.info('Starting Claude login...');

  return await loginService.login({
    providerId: 'claude',
    loginUrl: 'https://claude.ai/login',
    partition: `claude-${Date.now()}`,
    cookieEvent: 'claude-cookies',
    validate: async (data: { cookies: string; headers?: any; email?: string }) => {
      if (data.cookies) {
        logger.info('[Claude] Validating with captured cookies');
        
        // Try to extract email from cookies or fetch profile
        let email = data.email;
        
        if (!email) {
          logger.info('[Claude] Email not captured, fetching profile...');
          const profile = await getProfile(data.cookies);
          email = profile.email || undefined;
        }

        if (email) {
          logger.info(`[Claude] Validation success for email: ${email}`);
          return { isValid: true, cookies: data.cookies, email };
        }
      }
      return { isValid: false };
    },
  });
}

/**
 * Get user profile from Claude API
 */
export async function getProfile(cookies: string): Promise<{ email: string | null; name?: string }> {
  try {
    const url = `${BASE_URL}/api/organizations`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Cookie: cookies,
        Origin: BASE_URL,
        Referer: `${BASE_URL}/`,
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (response.status === 200 || response.ok) {
      const json = await response.json();
      if (Array.isArray(json) && json.length > 0) {
        // Claude returns organizations, extract user info from first org
        const org = json[0];
        return {
          email: org.created_by_user?.email || 'claude@user.com',
          name: org.name,
        };
      }
    }
    return { email: null };
  } catch (e) {
    logger.error('[Claude] Get Profile Error:', e);
    return { email: null };
  }
}
