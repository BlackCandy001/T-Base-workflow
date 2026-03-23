import { loginService } from '../../services/login.service';
import { createLogger } from '../../utils/logger';
import { proxyEvents } from '../../services/proxy-events';

const logger = createLogger('Gemini:API');

export const BASE_URL = 'https://gemini.google.com';

/**
 * Login to Gemini using browser with proxy interception
 * Gemini requires cookies AND specific metadata (snlm0e, bl)
 */
export async function login() {
  logger.info('Starting Gemini login...');

  let capturedMetadata: any = {};
  let capturedEmail = '';

  const onMetadata = (metadata: any) => {
    capturedMetadata = { ...capturedMetadata, ...metadata };
    logger.debug('[Gemini] Captured metadata:', metadata);
  };

  const onUserInfo = (data: any) => {
    if (data && data.email) {
      capturedEmail = data.email;
      logger.info(`[Gemini] Captured email: ${data.email}`);
    }
  };

  proxyEvents.on('gemini-metadata', onMetadata);
  proxyEvents.on('gemini-user-info', onUserInfo);

  try {
    return await loginService.login({
      providerId: 'gemini',
      loginUrl: 'https://gemini.google.com',
      partition: `gemini-${Date.now()}`,
      cookieEvent: 'gemini-cookies',
      infoEvent: 'gemini-user-info',
      extraEvents: ['gemini-metadata'],
      validate: async (data: { cookies: string; headers?: any; email?: string }) => {
        // Gemini needs cookies AND specific metadata
        if (data.cookies && capturedMetadata.snlm0e && capturedMetadata.bl) {
          const email = capturedEmail || data.email || 'gemini@user.com';
          logger.info(`[Gemini] Validation success for email: ${email}`);
          
          return {
            isValid: true,
            cookies: JSON.stringify({
              cookies: data.cookies,
              metadata: capturedMetadata,
            }),
            email,
          };
        }
        logger.debug('[Gemini] Validation pending - waiting for metadata...');
        return { isValid: false };
      },
    });
  } finally {
    proxyEvents.off('gemini-metadata', onMetadata);
    proxyEvents.off('gemini-user-info', onUserInfo);
  }
}
