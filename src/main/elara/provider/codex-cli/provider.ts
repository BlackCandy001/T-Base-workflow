import { Provider, SendMessageOptions } from '../types';
import fetch from 'node-fetch';
import { createLogger } from '../../utils/logger';
import { refreshToken } from './api';
import { getDb } from '../../services/db';

const logger = createLogger('CodexCLI:Provider');

// Lazy load zstd to avoid crash if not installed
let compress: any;
try {
  const zstd = require('@mongodb-js/zstd');
  compress = zstd.compress;
} catch (e) {
  logger.warn(
    '[@mongodb-js/zstd] not found. ZSTD compression will be disabled or fail.',
  );
}

export class CodexCLIProvider implements Provider {
  name = 'codex-cli';
  defaultModel = 'gpt-5.3-codex';

  async handleMessage(options: SendMessageOptions): Promise<void> {
    const {
      credential,
      messages,
      model,
      stream,
      onContent,
      onDone,
      onError,
      accountId,
      onSessionCreated,
      onMetadata,
      onRaw,
    } = options;

    let sessionId = options.conversationId;
    if (!sessionId) {
      const newId = require('crypto').randomUUID();
      sessionId = newId;
      if (onSessionCreated) onSessionCreated(newId);
      if (onMetadata) {
        onMetadata({
          conversation_id: newId,
          conversation_title: 'New Codex Chat',
        });
      }
    }

    let tokens: any;
    try {
      tokens = JSON.parse(credential);
    } catch (e) {
      tokens = { accessToken: credential };
    }

    const url = 'https://chatgpt.com/backend-api/codex/responses';

    const sendRequest = async (token: string) => {
      // Decode accountId from token if possible
      let chatgptAccountId = '';
      try {
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString(),
        );
        chatgptAccountId =
          payload['https://api.openai.com/auth']?.chatgpt_account_id;
      } catch (e) {
        logger.warn('[Codex] Failed to decode token for accountId');
      }

      const bodyObj: any = {
        model: model || this.defaultModel,
        instructions:
          "You are Codex, a coding agent based on GPT-5. You and the user share the same workspace and collaborate to achieve the user's goals.",
        input: messages.map((m: any) => ({
          type: 'message',
          role: m.role,
          content: [
            {
              type: m.role === 'assistant' ? 'output_text' : 'input_text',
              text: m.content,
            },
          ],
        })),
        store: false,
        stream: stream !== false,
        include: ['reasoning.encrypted_content'],
        reasoning: {
          effort: 'medium',
        },
      };

      const jsonBody = JSON.stringify(bodyObj);
      let finalBody: any = jsonBody;
      const headers: any = {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent':
          'codex_cli_rs/0.104.0 (Ubuntu 24.4.0; x86_64) gnome-terminal',
        originator: 'codex_cli_rs',
        Host: 'chatgpt.com',
      };

      if (chatgptAccountId) {
        headers['chatgpt-account-id'] = chatgptAccountId;
      }

      // Apply ZSTD compression if possible
      if (compress) {
        try {
          const compressed = await compress(Buffer.from(jsonBody));
          finalBody = compressed;
          headers['Content-Encoding'] = 'zstd';
          logger.info(
            `[Codex] Compressed request body: ${jsonBody.length} -> ${compressed.length} bytes`,
          );
        } catch (e) {
          logger.error('[Codex] ZSTD compression failed, sending raw JSON', e);
        }
      }

      return await fetch(url, {
        method: 'POST',
        headers,
        body: finalBody,
      });
    };

    try {
      let response = await sendRequest(tokens.accessToken);

      // Handle token expiration
      if (response.status === 401 && tokens.refreshToken) {
        logger.info('[Codex] Token expired, attempting refresh...');
        try {
          const newTokens = await refreshToken(tokens.refreshToken);
          tokens.accessToken = newTokens.access_token;
          tokens.refreshToken = newTokens.refresh_token || tokens.refreshToken;

          // Retry
          response = await sendRequest(tokens.accessToken);

          // Persist
          if (accountId) {
            try {
              const db = getDb();
              db.prepare('UPDATE accounts SET credential = ? WHERE id = ?').run(
                JSON.stringify(tokens),
                accountId,
              );
            } catch (e) {
              logger.error('[Codex] Failed to persist refreshed tokens:', e);
            }
          }
        } catch (refreshError) {
          logger.error('[Codex] Token refresh failed:', refreshError);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Codex API Error ${response.status}: ${errorText}`);
      }

      if (!response.body) throw new Error('No response body');

      let buffer = '';
      for await (const chunk of response.body) {
        const chunkStr = (chunk as Buffer).toString();
        if (onRaw) onRaw(chunkStr);
        buffer += chunkStr;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6).trim();
          if (jsonStr === '[DONE]') {
            onDone();
            return;
          }

          try {
            const json = JSON.parse(jsonStr);
            // Extract content based on Codex CLI response format
            const content =
              json.delta ||
              json.choices?.[0]?.delta?.content ||
              json.message?.content?.parts?.[0];
            if (content) {
              onContent(
                typeof content === 'string' ? content : JSON.stringify(content),
              );
            }
          } catch (e) {
            // Ignore partial chunks
          }
        }
      }
      onDone();
    } catch (err: any) {
      logger.error('[Codex] Handle Message Error:', err);
      onError(err);
    }
  }

  isModelSupported(model: string): boolean {
    const m = model.toLowerCase();
    return m.includes('codex') || m.startsWith('gpt-5');
  }
}
