import { exec, spawn, execSync } from 'child_process';
import fetch from 'node-fetch';
import * as crypto from 'crypto';
import * as http from 'http';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { createLogger } from '../../utils/logger';
import { proxyService } from '../../services/proxy.service';
import { loginService } from '../../services/login.service';

const logger = createLogger('GeminiCLI:API');

export const GEMINI_CONFIG = {
  clientId: process.env.GEMINI_CLIENT_ID || '',
  clientSecret: process.env.GEMINI_CLIENT_SECRET || '',
  authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  scopes: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
};

const CLIENT_METADATA = { ideType: 9, platform: 3, pluginType: 2 };

export async function login() {
  logger.info('Starting Gemini CLI login...');

  // 1. Start callback server
  const { port, server } = await startCallbackServer();
  const redirectUri = `http://localhost:${port}/callback`;

  // 2. Build Auth URL
  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: GEMINI_CONFIG.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: GEMINI_CONFIG.scopes.join(' '),
    state: state,
    access_type: 'offline',
    prompt: 'consent',
  });
  const authUrl = `${GEMINI_CONFIG.authorizeUrl}?${params.toString()}`;

  // 3. Open browser
  const startCmd =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';

  logger.info(`Opening browser: ${authUrl}`);
  exec(`${startCmd} "${authUrl}"`);

  // 4. Wait for code via local server
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

  // 5. Exchange code for tokens
  const tokens = await exchangeCode(code, redirectUri);

  // 6. Get user info and project ID
  const [userInfo, projectId] = await Promise.all([
    getUserInfo(tokens.access_token),
    fetchProjectId(tokens.access_token),
  ]);

  return {
    isValid: true,
    cookies: JSON.stringify({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      projectId: projectId,
    }),
    email: userInfo.email || 'gemini-cli@user.com',
  };
}

export async function loginWithTerminal() {
  logger.info('Starting Gemini CLI login with terminal...');

  const tempHome = path.join(os.tmpdir(), `gemini-login-fresh-${Date.now()}`);
  fs.mkdirSync(tempHome, { recursive: true });

  // Ensure proxy is running
  await proxyService.start();
  const { port } = proxyService.getServerInfo();
  const proxyUrl = `http://127.0.0.1:${port}`;

  const logFile = path.join(tempHome, 'gemini-cli.log');

  // Find a terminal emulator
  const terminals = [
    'gnome-terminal',
    'konsole',
    'xfce4-terminal',
    'kitty',
    'alacritty',
    'xterm',
    'x-terminal-emulator',
  ];
  let terminal = '';
  for (const t of terminals) {
    try {
      execSync(`which ${t}`, { stdio: 'ignore' });
      terminal = t;
      break;
    } catch (e) {}
  }

  const envStr = `export http_proxy=${proxyUrl} https_proxy=${proxyUrl} HTTP_PROXY=${proxyUrl} HTTPS_PROXY=${proxyUrl} all_proxy=${proxyUrl} ALL_PROXY=${proxyUrl} no_proxy='localhost,127.0.0.1' NO_PROXY='localhost,127.0.0.1' HOME=${tempHome} USERPROFILE=${tempHome} NODE_TLS_REJECT_UNAUTHORIZED=0 GOOGLE_GENAI_USE_GCA=true NO_BROWSER=true;`;
  // We run gemini with the environment variables to trigger the OAuth URL print
  const commandStr = `${envStr} gemini 2>&1 | tee ${logFile}`;

  let terminalSpawn: any;
  const env = {
    ...process.env,
    HOME: tempHome,
    http_proxy: proxyUrl,
    https_proxy: proxyUrl,
    NODE_TLS_REJECT_UNAUTHORIZED: '0',
    GOOGLE_GENAI_USE_GCA: 'true',
    NO_BROWSER: 'true',
  };

  if (terminal === 'gnome-terminal') {
    terminalSpawn = spawn(
      terminal,
      [
        '--',
        'bash',
        '-c',
        `${commandStr}; echo ''; echo 'Press enter to close...'; read`,
      ],
      { detached: true, env, stdio: 'ignore' },
    );
  } else if (terminal) {
    terminalSpawn = spawn(terminal, ['-e', `bash -c "${commandStr}; read"`], {
      detached: true,
      env,
      stdio: 'ignore',
    });
  } else {
    // Fallback
    terminalSpawn = spawn('bash', ['-c', commandStr], {
      env,
      detached: true,
      stdio: 'ignore',
    });
  }

  return new Promise((resolve, reject) => {
    let capturedUrl = '';
    const checkInterval = setInterval(() => {
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        // Search for Google OAuth URL in logs
        const urlMatch = content.match(
          /https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?[^\s"']+/,
        );
        if (urlMatch && !capturedUrl) {
          capturedUrl = urlMatch[0];
          logger.info(`[CLI] Captured Gemini login URL: ${capturedUrl}`);

          clearInterval(checkInterval);

          loginService
            .login({
              providerId: 'gemini-cli',
              loginUrl: capturedUrl,
              partition: `gemini-cli-${Date.now()}`,
              extraEvents: ['gemini-cli-tokens', 'gemini-cli-user-info'],
              validate: async (captured) => {
                if (captured.cookies || captured.headers) {
                  try {
                    const tokens = captured.cookies
                      ? JSON.parse(captured.cookies)
                      : {};
                    const projectId = captured.headers?.projectId || '';
                    const email =
                      captured.email ||
                      captured.headers?.email ||
                      'gemini-cli@user.com';

                    if (tokens.access_token && projectId) {
                      return {
                        isValid: true,
                        cookies: JSON.stringify({
                          accessToken: tokens.access_token,
                          refreshToken: tokens.refresh_token,
                          expiresIn: tokens.expires_in,
                          projectId: projectId,
                        }),
                        email: email,
                      };
                    }
                    // If we have tokens but no projectId yet, wait for next event
                    logger.debug(
                      `[CLI] Captured tokens, but waiting for projectId...`,
                    );
                  } catch (e) {
                    logger.error('Failed to parse captured tokens:', e);
                  }
                }
                return { isValid: false };
              },
            })
            .then((result) => {
              try {
                fs.rmSync(tempHome, { recursive: true, force: true });
              } catch (e) {}
              resolve(result);
            })
            .catch((err) => reject(err));
        }
      }
    }, 1000);

    terminalSpawn.on('error', (err: Error) => {
      clearInterval(checkInterval);
      reject(err);
    });

    setTimeout(() => {
      if (!capturedUrl) {
        clearInterval(checkInterval);
        reject(new Error('Timed out waiting for Gemini CLI login URL'));
      }
    }, 60000);
  });
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
  const response = await fetch(GEMINI_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: GEMINI_CONFIG.clientId,
      client_secret: GEMINI_CONFIG.clientSecret,
      code: code,
      redirect_uri: redirectUri,
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
    'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return await response.json();
}

export async function fetchProjectId(accessToken: string): Promise<string> {
  const response = await fetch(
    'https://cloudcode-pa.googleapis.com/v1internal:loadCodeAssist',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent':
          'GeminiCLI/0.29.7/gemini-3-pro-preview (linux; x64) google-api-nodejs-client/9.15.1',
        'X-Goog-Api-Client': 'gl-node/22.21.1',
      },
      body: JSON.stringify({
        metadata: CLIENT_METADATA,
        mode: 1,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    logger.warn(`Failed to fetch project ID: ${error}`);
    return '';
  }

  const data = await response.json();
  let projectId = '';
  if (data.cloudaicompanionProject) {
    projectId =
      typeof data.cloudaicompanionProject === 'string'
        ? data.cloudaicompanionProject.trim()
        : data.cloudaicompanionProject.id?.trim() || '';
  }

  return projectId;
}

export async function getModels(
  accessToken: string,
  projectId: string,
): Promise<any[]> {
  const response = await fetch(
    'https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent':
          'GeminiCLI/0.29.7/gemini-3-pro-preview (linux; x64) google-api-nodejs-client/9.15.1',
        'X-Goog-Api-Client': 'gl-node/22.21.1',
      },
      body: JSON.stringify({
        project: projectId,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    logger.error(`Failed to fetch Gemini CLI models: ${error}`);
    return [];
  }

  const data = await response.json();
  if (!data.buckets) return [];

  return data.buckets.map((bucket: any) => ({
    id: bucket.modelId,
    name: bucket.modelId,
  }));
}

export async function refreshToken(refreshToken: string) {
  const response = await fetch(GEMINI_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: GEMINI_CONFIG.clientId,
      client_secret: GEMINI_CONFIG.clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Gemini CLI token');
  }

  return await response.json();
}
