import { loginService } from '../../services/login.service';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Groq:API');

export const BASE_URL = 'https://console.groq.com';

/**
 * Login to Groq using browser with proxy interception
 */
export async function login() {
  logger.info('Starting Groq login...');

  return await loginService.login({
    providerId: 'groq',
    loginUrl: 'https://console.groq.com/login',
    partition: `groq-${Date.now()}`,
    cookieEvent: 'groq-cookies',
    validate: async (data: { cookies: string; headers?: any; email?: string }) => {
      if (!data.cookies) return { isValid: false };

      let email = 'groq@user.com';
      try {
        // Extract email from JWT token
        const cookieList = data.cookies.split(';').map((c) => {
          const parts = c.trim().split('=');
          return { name: parts[0], value: parts.slice(1).join('=') };
        });
        
        const sessionJwt = cookieList.find((c) => c.name === 'stytch_session_jwt')?.value;
        if (sessionJwt) {
          const base64Url = sessionJwt.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join(''),
          );
          const payload = JSON.parse(jsonPayload);
          const stytchSession = payload['https://stytch.com/session'];
          if (stytchSession?.authentication_factors?.[0]?.email_factor?.email_address) {
            email = stytchSession.authentication_factors[0].email_factor.email_address;
            logger.info(`[Groq] Extracted email from JWT: ${email}`);
          }
        }
      } catch (e) {
        logger.warn('[Groq] Failed to extract email from JWT:', e);
      }

      return { isValid: true, cookies: data.cookies, email };
    },
  });
}
