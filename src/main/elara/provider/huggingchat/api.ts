import { loginService } from '../../services/login.service';
import { createLogger } from '../../utils/logger';
import { proxyEvents } from '../../services/proxy-events';

const logger = createLogger('HuggingChat:API');

export const BASE_URL = 'https://huggingface.co/chat';

/**
 * Login to HuggingChat using browser with proxy interception
 */
export async function login() {
  logger.info('Starting HuggingChat login...');

  let capturedEmail = '';

  const onLoginData = (email: string) => {
    logger.info(`[HuggingChat] Captured email from form: ${email}`);
    capturedEmail = email;
  };

  proxyEvents.on('hugging-chat-login-data', onLoginData);

  try {
    return await loginService.login({
      providerId: 'huggingchat',
      loginUrl: 'https://huggingface.co/chat/login',
      partition: `huggingchat-${Date.now()}`,
      cookieEvent: 'hugging-chat-cookies',
      infoEvent: 'hugging-chat-login-data',
      extraEvents: ['hugging-chat-login-data'],
      validate: async (data: { cookies: string; headers?: any; email?: string }) => {
        if (!data.cookies) return { isValid: false };

        logger.debug('[HuggingChat] Validating session...');
        let identityEmail = '';
        let apiEmail = '';

        // Verify session via API
        try {
          const chatUserRes = await fetch('https://huggingface.co/chat/api/v2/user', {
            headers: {
              Cookie: data.cookies,
              'User-Agent':
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
              accept: 'application/json',
            },
          });

          if (chatUserRes.ok) {
            const chatUser = await chatUserRes.json();
            if (chatUser && (chatUser.email || chatUser.username)) {
              apiEmail = chatUser.email || `${chatUser.username}@hf.co`;
              logger.debug(`[HuggingChat] API returned email: ${apiEmail}`);
            }
          }
        } catch (e) {
          logger.warn('[HuggingChat] Chat API verify failed:', e);
        }

        // Priority: Use captured form email if available
        if (capturedEmail) {
          identityEmail = capturedEmail;
          logger.info(`[HuggingChat] Using captured form email: ${identityEmail}`);
        } else if (apiEmail) {
          identityEmail = apiEmail;
          logger.info(`[HuggingChat] Using API email: ${identityEmail}`);
        }

        if (identityEmail) {
          logger.info(`[HuggingChat] Validation success: ${identityEmail}`);
          return {
            isValid: true,
            cookies: data.cookies,
            email: identityEmail,
          };
        }

        return { isValid: false };
      },
    });
  } finally {
    proxyEvents.off('hugging-chat-login-data', onLoginData);
  }
}
