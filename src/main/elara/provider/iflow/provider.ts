import { Provider, SendMessageOptions } from '../types';
import fetch from 'node-fetch';
import { createLogger } from '../../utils/logger';
import { refreshToken } from './api';
import * as crypto from 'crypto';

const logger = createLogger('iFlow:Provider');

export class IFlowProvider implements Provider {
  name = 'iflow';
  defaultModel = 'iflow-3.5';

  async handleMessage(options: SendMessageOptions): Promise<void> {
    const { credential, messages, model, stream, onContent, onDone, onError } =
      options;

    let tokens: any;
    try {
      tokens = JSON.parse(credential);
    } catch (e) {
      tokens = { accessToken: credential };
    }

    const url = 'https://apis.iflow.cn/v1/chat/completions';

    const sendRequest = async (accessToken: string, apiKey: string) => {
      const sessionID = `session-${crypto.randomUUID()}`;
      const timestamp = Date.now();
      const userAgent = 'iFlow-Cli';

      const payload = `${userAgent}:${sessionID}:${timestamp}`;
      const signature = crypto
        .createHmac('sha256', apiKey || accessToken)
        .update(payload)
        .digest('hex');

      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
          'session-id': sessionID,
          'x-iflow-timestamp': timestamp.toString(),
          'x-iflow-signature': signature,
          Authorization: `Bearer ${apiKey || accessToken}`,
          ...(stream !== false && { Accept: 'text/event-stream' }),
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: stream !== false,
        }),
      });
    };

    try {
      let response = await sendRequest(tokens.accessToken, tokens.apiKey);

      // Handle 401
      if (response.status === 401 && tokens.refreshToken) {
        logger.info('[iFlow] Token expired, attempting refresh...');
        try {
          const newTokens = await refreshToken(tokens.refreshToken);
          tokens.accessToken = newTokens.access_token;
          tokens.refreshToken = newTokens.refresh_token || tokens.refreshToken;

          response = await sendRequest(tokens.accessToken, tokens.apiKey);
        } catch (refreshError) {
          logger.error('[iFlow] Token refresh failed:', refreshError);
        }
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`iFlow API Error ${response.status}: ${error}`);
      }

      if (stream !== false) {
        if (!response.body) throw new Error('No response body');

        let buffer = '';
        for await (const chunk of response.body as any) {
          buffer += chunk.toString();

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
              // Ignore parse errors
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
      logger.error('[iFlow] Handle Message Error:', err);
      onError(err);
    }
  }

  isModelSupported(model: string): boolean {
    const m = model.toLowerCase();
    return m.includes('iflow');
  }
}
