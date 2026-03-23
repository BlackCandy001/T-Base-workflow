import { exec } from 'child_process';
import fetch from 'node-fetch';
import * as crypto from 'crypto';
import * as http from 'http';
import { createLogger } from '../../utils/logger';

const logger = createLogger('iFlow:API');

export const IFLOW_CONFIG = {
  clientId: '10009311001',
  clientSecret: '4Z3YjXycVsQvyGF1etiNlIBB4RsqSDtW',
  authorizeUrl: 'https://iflow.cn/oauth',
  tokenUrl: 'https://iflow.cn/oauth/token',
  userInfoUrl: 'https://iflow.cn/api/user/info',
};

export async function login() {
  logger.info('Starting iFlow login...');

  // 1. Start callback server
  const { port, server } = await startCallbackServer();
  const redirectUri = `http://localhost:${port}/callback`;

  // 2. Build Auth URL
  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    loginMethod: 'phone',
    type: 'cli',
    redirect: redirectUri,
    state: state,
    client_id: IFLOW_CONFIG.clientId,
  });
  const authUrl = `${IFLOW_CONFIG.authorizeUrl}?${params.toString()}`;

  // 3. Open browser
  const startCmd =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';

  logger.info(`Opening browser: ${authUrl}`);
  exec(`${startCmd} "${authUrl}"`);

  // 4. Wait for code
  const code = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Authentication timeout'));
    }, 300000);

    server.on('code', (capturedCode: string) => {
      clearTimeout(timeout);
      server.close();
      resolve(capturedCode);
    });
  });

  // 5. Exchange code
  const tokens = await exchangeCode(code, redirectUri);

  // 6. Get user info (includes apiKey)
  const userInfo = await getUserInfo(tokens.access_token);

  return {
    isValid: true,
    cookies: JSON.stringify({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      apiKey: userInfo.apiKey,
    }),
    email: userInfo.email || userInfo.phone || 'iflow-user@user.com',
  };
}

async function startCallbackServer(): Promise<{ port: number; server: any }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        if (code) {
          server.emit('code', code);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(
            '<h1>Authentication Successful!</h1><p>You can close this window now.</p>',
          );
        } else {
          res.writeHead(400);
          res.end('Authentication failed: No code received');
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as any;
      resolve({ port: address.port, server });
    });
  });
}

async function exchangeCode(code: string, redirectUri: string) {
  const basicAuth = Buffer.from(
    `${IFLOW_CONFIG.clientId}:${IFLOW_CONFIG.clientSecret}`,
  ).toString('base64');

  const response = await fetch(IFLOW_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: IFLOW_CONFIG.clientId,
      client_secret: IFLOW_CONFIG.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return await response.json();
}

async function getUserInfo(accessToken: string) {
  const response = await fetch(
    `${IFLOW_CONFIG.userInfoUrl}?accessToken=${encodeURIComponent(accessToken)}`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error('Failed to get user info: success=false');
  }

  return result.data;
}

export async function refreshToken(refreshToken: string) {
  const basicAuth = Buffer.from(
    `${IFLOW_CONFIG.clientId}:${IFLOW_CONFIG.clientSecret}`,
  ).toString('base64');

  const response = await fetch(IFLOW_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: IFLOW_CONFIG.clientId,
      client_secret: IFLOW_CONFIG.clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh iFlow token');
  }

  return await response.json();
}
