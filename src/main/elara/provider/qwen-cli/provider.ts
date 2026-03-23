import { Provider, SendMessageOptions } from '../types';
import fetch from 'node-fetch';
import { createLogger } from '../../utils/logger';
import { refreshToken } from './api';
import { getDb } from '../../services/db';

const logger = createLogger('QwenCoderCLI:Provider');

export class QwenCoderCLIProvider implements Provider {
  name = 'qwen-cli';
  defaultModel = 'coder-model';

  async handleMessage(options: SendMessageOptions): Promise<void> {
    const { credential, messages, model, stream, onContent, onDone, onError } =
      options;

    let tokens: any;
    try {
      tokens = JSON.parse(credential);
    } catch (e) {
      // Fallback if credential is just the access token
      tokens = { accessToken: credential };
    }

    const url = 'https://portal.qwen.ai/v1/chat/completions';

    const sendRequest = async (token: string) => {
      const commonHeaders = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'QwenCode/0.10.6 (linux; x64)',
        'x-dashscope-cachecontrol': 'enable',
        'x-dashscope-useragent': 'QwenCode/0.10.6 (linux; x64)',
        'x-dashscope-authtype': 'qwen-oauth',
        'x-stainless-lang': 'js',
        'x-stainless-os':
          process.platform === 'win32'
            ? 'Windows'
            : process.platform === 'darwin'
              ? 'MacOS'
              : 'Linux',
        'x-stainless-arch': process.arch,
        'x-stainless-runtime': 'node',
        'x-stainless-runtime-version': process.version,
      };

      return await fetch(url, {
        method: 'POST',
        headers: {
          ...commonHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          messages: messages.map((m: any) => ({
            role: m.role,
            content: [{ type: 'text', text: m.content }],
          })),
          stream: stream !== false,
          stream_options:
            stream !== false ? { include_usage: true } : undefined,
        }),
      });
    };

    try {
      let response = await sendRequest(tokens.accessToken);

      // Handle token expiration
      if (response.status === 401 && tokens.refreshToken) {
        logger.info('[Qwen] Token expired, attempting refresh...');
        try {
          const newTokens = await refreshToken(tokens.refreshToken);
          tokens.accessToken = newTokens.access_token;
          tokens.refreshToken = newTokens.refresh_token || tokens.refreshToken;

          // Retry with new token
          response = await sendRequest(tokens.accessToken);

          // Persist new tokens to DB
          if (options.accountId) {
            try {
              const db = getDb();
              const newCredential = JSON.stringify({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresIn: newTokens.expires_in || tokens.expiresIn || 21600,
              });
              db.prepare('UPDATE accounts SET credential = ? WHERE id = ?').run(
                newCredential,
                options.accountId,
              );
              logger.info(
                `[Qwen] Persisted refreshed tokens for account ${options.accountId}`,
              );
            } catch (dbError) {
              logger.error(
                '[Qwen] Failed to persist refreshed tokens:',
                dbError,
              );
            }
          }
        } catch (refreshError) {
          logger.error('[Qwen] Token refresh failed:', refreshError);
        }
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Qwen API Error ${response.status}: ${error}`);
      }

      if (stream !== false) {
        if (!response.body) throw new Error('No response body');

        let buffer = '';
        for await (const chunk of response.body) {
          const chunkStr = chunk.toString();
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
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                onContent(content);
              }
            } catch (e) {
              // Ignore parse errors for partial chunks
            }
          }
        }
        onDone();
      } else {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content || '';
        onContent(content);
        onDone();
      }
    } catch (err: any) {
      logger.error('[Qwen] Handle Message Error:', err);
      onError(err);
    }
  }

  isModelSupported(model: string): boolean {
    const m = model.toLowerCase();
    return m.includes('qwen') || m.startsWith('qwen-');
  }
}
