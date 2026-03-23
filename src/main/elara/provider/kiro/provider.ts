import { Provider, SendMessageOptions } from '../types';
import fetch from 'node-fetch';
import { createLogger } from '../../utils/logger';
import { refreshToken } from './api';
import * as crypto from 'crypto';

const logger = createLogger('Kiro:Provider');

export class KiroProvider implements Provider {
  name = 'kiro';
  defaultModel = 'anthropic.claude-3-5-sonnet-20240620-v1:0';

  async handleMessage(options: SendMessageOptions): Promise<void> {
    const { credential, messages, model, stream, onContent, onDone, onError } =
      options;

    let tokens: any;
    try {
      tokens = JSON.parse(credential);
    } catch (e) {
      tokens = { accessToken: credential };
    }

    const url =
      'https://codewhisperer.us-east-1.amazonaws.com/generateAssistantResponse';

    const buildPayload = () => {
      const history: any[] = [];
      let currentMessage: any = null;

      // Simple message conversion for Kiro
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const isLast = i === messages.length - 1;
        const role =
          msg.role === 'assistant'
            ? 'assistantResponseMessage'
            : 'userInputMessage';

        if (isLast && msg.role !== 'assistant') {
          currentMessage = {
            userInputMessage: {
              content: msg.content,
              modelId: model || this.defaultModel,
              origin: 'AI_EDITOR',
            },
          };
        } else {
          history.push({
            [role]: {
              content: msg.content,
            },
          });
        }
      }

      const timestamp = new Date().toISOString();
      const finalContent = `[Context: Current time is ${timestamp}]\n\n${currentMessage?.userInputMessage?.content || ''}`;

      return {
        conversationState: {
          chatTriggerType: 'MANUAL',
          conversationId: crypto.randomUUID(),
          currentMessage: {
            userInputMessage: {
              ...currentMessage?.userInputMessage,
              content: finalContent,
            },
          },
          history: history,
        },
      };
    };

    const sendRequest = async (token: string) => {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.amazon.eventstream',
          'X-Amz-Target':
            'AmazonCodeWhispererStreamingService.GenerateAssistantResponse',
          Authorization: `Bearer ${token}`,
          'Amz-Sdk-Invocation-Id': crypto.randomUUID(),
          'Amz-Sdk-Request': 'attempt=1; max=3',
        },
        body: JSON.stringify(buildPayload()),
      });
    };

    try {
      let response = await sendRequest(tokens.accessToken);

      // Handle 401
      if (response.status === 401 && tokens.refreshToken && tokens.clientId) {
        logger.info('[Kiro] Token expired, attempting refresh...');
        try {
          const newTokens = await refreshToken(
            tokens.refreshToken,
            tokens.clientId,
            tokens.clientSecret,
            tokens.region || 'us-east-1',
          );
          tokens.accessToken = newTokens.accessToken;
          tokens.refreshToken = newTokens.refreshToken;

          response = await sendRequest(tokens.accessToken);
        } catch (refreshErr) {
          logger.error('[Kiro] Token refresh failed:', refreshErr);
        }
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Kiro API Error ${response.status}: ${error}`);
      }

      if (stream !== false) {
        let buffer = Buffer.alloc(0);
        const body: any = response.body;

        body.on('data', (chunk: Buffer) => {
          buffer = Buffer.concat([buffer, chunk]);

          while (buffer.length >= 16) {
            const totalLength = buffer.readUInt32BE(0);
            if (totalLength > buffer.length || totalLength < 16) break;

            const eventData = buffer.slice(0, totalLength);
            buffer = buffer.slice(totalLength);

            const event = parseEventFrame(eventData);
            if (!event) continue;

            const eventType = event.headers[':event-type'];
            if (
              (eventType === 'assistantResponseEvent' ||
                eventType === 'codeEvent') &&
              event.payload?.content
            ) {
              onContent(event.payload.content);
            } else if (eventType === 'messageStopEvent') {
              // End of message
            }
          }
        });

        body.on('end', () => onDone());
        body.on('error', (err: any) => onError(err));
      } else {
        // Collect all content for non-streaming
        let fullContent = '';
        let buffer = Buffer.alloc(0);
        const body: any = response.body;

        body.on('data', (chunk: Buffer) => {
          buffer = Buffer.concat([buffer, chunk]);
          while (buffer.length >= 16) {
            const totalLength = buffer.readUInt32BE(0);
            if (totalLength > buffer.length || totalLength < 16) break;
            const eventData = buffer.slice(0, totalLength);
            buffer = buffer.slice(totalLength);
            const event = parseEventFrame(eventData);
            if (!event) continue;
            const eventType = event.headers[':event-type'];
            if (
              (eventType === 'assistantResponseEvent' ||
                eventType === 'codeEvent') &&
              event.payload?.content
            ) {
              fullContent += event.payload.content;
            }
          }
        });

        body.on('end', () => {
          onContent(fullContent);
          onDone();
        });
        body.on('error', (err: any) => onError(err));
      }
    } catch (err: any) {
      logger.error('[Kiro] Handle Message Error:', err);
      onError(err);
    }
  }

  isModelSupported(model: string): boolean {
    const m = model.toLowerCase();
    return m.includes('kiro') || m.startsWith('anthropic.claude');
  }
}

function parseEventFrame(data: Buffer) {
  try {
    const headersLength = data.readUInt32BE(4);
    const headers: Record<string, string> = {};
    let offset = 12;
    const headerEnd = 12 + headersLength;

    while (offset < headerEnd && offset < data.length) {
      const nameLen = data[offset];
      offset++;
      const name = data.slice(offset, offset + nameLen).toString('utf8');
      offset += nameLen;
      const headerType = data[offset];
      offset++;

      if (headerType === 7) {
        // String
        const valueLen = data.readUInt16BE(offset);
        offset += 2;
        const value = data.slice(offset, offset + valueLen).toString('utf8');
        offset += valueLen;
        headers[name] = value;
      } else {
        // Skip unknown types for simplicity
        break;
      }
    }

    const payloadStart = 12 + headersLength;
    const payloadEnd = data.length - 4;
    let payload: any = null;

    if (payloadEnd > payloadStart) {
      const payloadStr = data.slice(payloadStart, payloadEnd).toString('utf8');
      try {
        payload = JSON.parse(payloadStr);
      } catch {
        payload = { raw: payloadStr };
      }
    }

    return { headers, payload };
  } catch {
    return null;
  }
}
