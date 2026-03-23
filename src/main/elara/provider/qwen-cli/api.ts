import { exec, spawn, execSync } from 'child_process';
import fetch from 'node-fetch';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { createLogger } from '../../utils/logger';
import { loginService } from '../../services/login.service';
import { proxyService } from '../../services/proxy.service';

const logger = createLogger('QwenCLI:API');

export const QWEN_CONFIG = {
  clientId: 'f0304373b74a44d2b584a3fb70ca9e56',
  deviceCodeUrl: 'https://chat.qwen.ai/api/v1/oauth2/device/code',
  tokenUrl: 'https://chat.qwen.ai/api/v1/oauth2/token',
  scope: 'openid profile email model.completion',
  codeChallengeMethod: 'S256',
};

function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}

export async function getDeviceCode() {
  logger.info('Requesting Qwen CLI device code...');

  const { codeVerifier, codeChallenge } = generatePKCE();

  // 1. Request device code
  const response = await fetch(QWEN_CONFIG.deviceCodeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: QWEN_CONFIG.clientId,
      scope: QWEN_CONFIG.scope,
      code_challenge: codeChallenge,
      code_challenge_method: QWEN_CONFIG.codeChallengeMethod,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Device code request failed: ${error}`);
  }

  const deviceData = await response.json();
  const loginUrl =
    deviceData.verification_uri_complete || deviceData.verification_uri;

  return {
    device_code: deviceData.device_code,
    user_code: deviceData.user_code,
    verification_uri: loginUrl,
    interval: deviceData.interval || 5,
    code_verifier: codeVerifier,
  };
}

export async function login() {
  logger.info('Starting Qwen CLI login (automatic legacy)...');

  const deviceData = await getDeviceCode();

  // 2. Open browser (legacy behavior)
  const startCmd =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';

  logger.info(`Opening browser: ${deviceData.verification_uri}`);
  exec(`${startCmd} "${deviceData.verification_uri}"`);

  // 3. Poll for token
  return await completeLogin(
    deviceData.device_code,
    deviceData.code_verifier,
    deviceData.interval,
  );
}

export async function completeLogin(
  deviceCode: string,
  codeVerifier: string,
  intervalSeconds: number,
) {
  // 3. Poll for token
  const tokens = await pollForToken(deviceCode, codeVerifier, intervalSeconds);

  // 4. Get profile (optional but good for display)
  const profile = await getProfile(tokens.access_token);

  return {
    isValid: true,
    cookies: JSON.stringify({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    }),
    email: profile.email || 'qwen-cli@user.com',
  };
}

export async function loginWithBrowser() {
  logger.info('Starting Qwen CLI login with real CLI module and terminal...');

  const tempHome = path.join(os.tmpdir(), `qwen-login-fresh`);
  if (fs.existsSync(tempHome))
    fs.rmSync(tempHome, { recursive: true, force: true });
  fs.mkdirSync(tempHome, { recursive: true });

  // Explicitly clear the real ~/.qwen and ~/.codex to prevent auto-login
  const realQwen = path.join(os.homedir(), '.qwen');
  const realCodex = path.join(os.homedir(), '.codex');
  try {
    if (fs.existsSync(realQwen))
      fs.rmSync(realQwen, { recursive: true, force: true });
    if (fs.existsSync(realCodex))
      fs.rmSync(realCodex, { recursive: true, force: true });
    logger.info('[CLI] Cleared real Qwen/Codex cache to ensure fresh login');
  } catch (e) {
    logger.warn('[CLI] Failed to clear real Qwen/Codex cache:', e);
  }

  const cliPath = path.resolve(__dirname, '../../../../temp/qwen-cli/cli.js');

  // Ensure proxy is running to get the port
  await proxyService.start();
  const { port } = proxyService.getServerInfo();

  const logFile = path.join(tempHome, 'qwen-cli.log');

  // Find a terminal emulator (Linux specific)
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

  const nodePath = process.execPath;
  const proxyUrl = `http://127.0.0.1:${port}`;
  const env = {
    ...process.env,
    HOME: tempHome,
    USERPROFILE: tempHome,
    http_proxy: proxyUrl,
    https_proxy: proxyUrl,
    HTTP_PROXY: proxyUrl,
    HTTPS_PROXY: proxyUrl,
    all_proxy: proxyUrl,
    ALL_PROXY: proxyUrl,
    no_proxy: '',
    NO_PROXY: '',
    NODE_TLS_REJECT_UNAUTHORIZED: '0',
  };

  const envStr = `export http_proxy=${proxyUrl} https_proxy=${proxyUrl} HTTP_PROXY=${proxyUrl} HTTPS_PROXY=${proxyUrl} all_proxy=${proxyUrl} ALL_PROXY=${proxyUrl} no_proxy='localhost,127.0.0.1' NO_PROXY='localhost,127.0.0.1' HOME=${tempHome} USERPROFILE=${tempHome} NODE_TLS_REJECT_UNAUTHORIZED=0;`;
  const commandStr = `${envStr} (sleep 2; echo "qwen"; sleep 1; echo "") | ${nodePath} ${cliPath} --auth-type qwen-oauth 2>&1 | tee ${logFile}`;

  let terminalSpawn: any;
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
  } else if (terminal === 'konsole') {
    terminalSpawn = spawn(
      terminal,
      ['-e', 'bash', '-c', `${commandStr}; read`],
      { detached: true, env, stdio: 'ignore' },
    );
  } else if (terminal === 'xfce4-terminal') {
    terminalSpawn = spawn(terminal, ['-e', `bash -c "${commandStr}; read"`], {
      detached: true,
      env,
      stdio: 'ignore',
    });
  } else if (terminal === 'kitty' || terminal === 'alacritty') {
    terminalSpawn = spawn(
      terminal,
      ['-e', 'bash', '-c', `${commandStr}; read`],
      { detached: true, env, stdio: 'ignore' },
    );
  } else if (terminal) {
    terminalSpawn = spawn(terminal, ['-e', `bash -c "${commandStr}; read"`], {
      detached: true,
      env,
      stdio: 'ignore',
    });
  } else {
    // Fallback to background if no terminal found
    terminalSpawn = spawn(nodePath, [cliPath, 'chat', '--empty'], {
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
        const urlMatch = content.match(
          /https:\/\/chat\.qwen\.ai\/authorize\?user_code=[A-Z0-9-]+&client=qwen-code/,
        );
        if (urlMatch && !capturedUrl) {
          capturedUrl = urlMatch[0];
          logger.info(`[CLI] Captured login URL from log: ${capturedUrl}`);

          clearInterval(checkInterval);

          loginService
            .login({
              providerId: 'qwen-cli',
              loginUrl: capturedUrl,
              partition: 'qwen-cli',
              extraEvents: ['qwen-cli-tokens', 'qwen-cli-user-info'],
              validate: async (captured) => {
                logger.info('[Login] Validation called with captured data');
                logger.debug(
                  `[Login] Has cookies: ${!!captured.cookies}, Has email: ${!!captured.email}`,
                );
                if (captured.cookies && captured.email) {
                  logger.info(
                    `[Login] Validation successful for ${captured.email}`,
                  );
                  return { isValid: true };
                }
                logger.warn(`[Login] Validation failed: missing data`);
                return { isValid: false };
              },
            })
            .then((result) => {
              // Cleanup
              try {
                fs.rmSync(tempHome, { recursive: true, force: true });
              } catch (e) {}
              resolve(result);
            })
            .catch((err) => {
              reject(err);
            });
        }
      }
    }, 1000);

    terminalSpawn.on('error', (err: Error) => {
      clearInterval(checkInterval);
      logger.error(`[Terminal Error] ${err.message}`);
      reject(err);
    });

    // Timeout 1 min
    setTimeout(() => {
      if (!capturedUrl) {
        clearInterval(checkInterval);
        reject(
          new Error('Timed out waiting for Qwen CLI login URL in terminal'),
        );
      }
    }, 60000);
  });
}

async function pollForToken(
  deviceCode: string,
  codeVerifier: string,
  intervalSeconds: number,
) {
  const maxAttempts = 60; // 5 minutes approx
  const pollInterval = intervalSeconds * 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const response = await fetch(QWEN_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        client_id: QWEN_CONFIG.clientId,
        device_code: deviceCode,
        code_verifier: codeVerifier,
      }),
    });

    if (response.ok) {
      return await response.json();
    }

    const error = await response.json();

    if (error.error === 'authorization_pending') {
      continue;
    } else if (error.error === 'slow_down') {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    } else if (error.error === 'expired_token') {
      throw new Error('Device code expired');
    } else if (error.error === 'access_denied') {
      throw new Error('Access denied');
    } else {
      throw new Error(error.error_description || error.error);
    }
  }

  throw new Error('Authorization timeout');
}

export async function getProfile(accessToken: string) {
  try {
    const commonHeaders = {
      'User-Agent': `QwenCode/0.10.6 (${process.platform}; ${process.arch})`,
      'x-dashscope-useragent': `QwenCode/0.10.6 (${process.platform}; ${process.arch})`,
      'x-dashscope-authtype': 'qwen-oauth',
      'x-dashscope-cachecontrol': 'enable',
      Accept: 'application/json',
    };

    const response = await fetch('https://chat.qwen.ai/api/v1/user/info', {
      headers: {
        ...commonHeaders,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (response.ok) {
      const data = await response.json();
      return {
        email: data.email || data.username || 'qwen-cli@user.com',
        name: data.nickname || data.username,
      };
    }
  } catch (e) {
    logger.error('Failed to fetch Qwen profile:', e);
  }
  return { email: null };
}

export async function refreshToken(refreshToken: string) {
  const response = await fetch(QWEN_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: QWEN_CONFIG.clientId,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Qwen token');
  }

  const json = await response.json();
  let data = json;

  // Handle wrapped response
  if (
    json.response &&
    typeof json.response === 'string' &&
    json.response.startsWith('{')
  ) {
    try {
      data = JSON.parse(json.response);
      logger.debug('[API] Parsed wrapped refresh token response');
    } catch (e) {
      logger.warn(
        '[API] Failed to parse wrapped response field in refreshToken',
      );
    }
  }

  return data;
}
