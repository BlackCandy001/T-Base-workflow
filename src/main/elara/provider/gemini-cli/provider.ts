import { Provider, SendMessageOptions } from '../types';
import fetch from 'node-fetch';
import { createLogger } from '../../utils/logger';
import { refreshToken, fetchProjectId, getModels } from './api';
import { getDb } from '../../services/db';

const logger = createLogger('GeminiCLI:Provider');

export class GeminiCLIProvider implements Provider {
  name = 'gemini-cli';
  defaultModel = 'gemini-1.5-pro';

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
    } = options;

    let tokens: any;
    try {
      tokens = JSON.parse(credential);
    } catch (e) {
      tokens = { accessToken: credential };
    }

    // Attempt to fetch projectId if missing
    if (!tokens.projectId && tokens.accessToken) {
      try {
        tokens.projectId = await fetchProjectId(tokens.accessToken);
      } catch (e) {
        logger.warn(
          '[GeminiCLI] Project ID fetch failed, continuing without it',
        );
      }
    }

    const url =
      'https://cloudcode-pa.googleapis.com/v1internal:streamGenerateContent?alt=sse';

    const sendRequest = async (token: string, projectId?: string) => {
      const sessionId = Math.random().toString(36).substring(2, 15);
      const userPromptId = `${sessionId}########1`;

      const body: any = {
        model: model || this.defaultModel,
        project: projectId || 'reference-courage-zzsgc',
        user_prompt_id: userPromptId,
        request: {
          contents: messages.map((m) => ({
            role: m.role === 'assistant' ? 'model' : m.role,
            parts: [{ text: m.content }],
          })),
        },
      };

      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
          'User-Agent':
            'GeminiCLI/0.29.7/gemini-3-pro-preview (linux; x64) google-api-nodejs-client/9.15.1',
          'X-Goog-Api-Client': 'gl-node/22.21.1',
        },
        body: JSON.stringify(body),
      });
    };

    try {
      let response = await sendRequest(tokens.accessToken, tokens.projectId);

      // Handle 401
      if (response.status === 401 && tokens.refreshToken) {
        logger.info('[GeminiCLI] Token expired, attempting refresh...');
        try {
          const newTokens = await refreshToken(tokens.refreshToken);
          tokens.accessToken = newTokens.access_token;
          tokens.refreshToken = newTokens.refresh_token || tokens.refreshToken;

          if (!tokens.projectId) {
            tokens.projectId = await fetchProjectId(tokens.accessToken);
          }

          // Persist new tokens to DB if accountId is provided
          if (accountId) {
            try {
              const db = getDb();
              db.prepare('UPDATE accounts SET credential = ? WHERE id = ?').run(
                JSON.stringify(tokens),
                accountId,
              );
              logger.info(
                `[GeminiCLI] Persisted refreshed tokens for account ${accountId}`,
              );
            } catch (dbError) {
              logger.error(
                '[GeminiCLI] Failed to persist new tokens:',
                dbError,
              );
            }
          }

          response = await sendRequest(tokens.accessToken, tokens.projectId);
        } catch (refreshError) {
          logger.error('[GeminiCLI] Token refresh failed:', refreshError);
        }
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini CLI API Error ${response.status}: ${error}`);
      }

      if (stream !== false) {
        if (!response.body) throw new Error('No response body');

        let buffer = '';
        for await (const chunk of response.body as any) {
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
              const responseObj = json.response || json;
              const content =
                responseObj.candidates?.[0]?.content?.parts?.[0]?.text;
              if (content) {
                onContent(content);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
        onDone();
      } else {
        const json = await response.json();
        const responseObj = json.response || json;
        const content =
          responseObj.candidates?.[0]?.content?.parts?.[0]?.text || '';
        onContent(content);
        onDone();
      }
    } catch (err: any) {
      logger.error('[GeminiCLI] Handle Message Error:', err);
      onError(err);
    }
  }

  async getModels(credential: string): Promise<any[]> {
    let tokens: any;
    try {
      tokens = JSON.parse(credential);
    } catch (e) {
      tokens = { accessToken: credential };
    }

    if (!tokens.accessToken) return [];

    let projectId = tokens.projectId;
    if (!projectId) {
      projectId = await fetchProjectId(tokens.accessToken);
    }

    if (!projectId) projectId = 'reference-courage-zzsgc';

    return await getModels(tokens.accessToken, projectId);
  }

  isModelSupported(model: string): boolean {
    const m = model.toLowerCase();
    return m.includes('gemini') || m.startsWith('gemini-');
  }
}
