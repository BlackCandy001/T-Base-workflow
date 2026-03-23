import { spawn, execSync } from 'child_process';
import fetch from 'node-fetch';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { loginService } from '../../services/login.service';
import { proxyService } from '../../services/proxy.service';
import { createLogger } from '../../utils/logger';

const logger = createLogger('CodexCLI:API');

export async function getProfile(accessToken: string) {
  try {
    const response = await fetch('https://chatgpt.com/backend-api/wham/usage', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'User-Agent':
          'codex_cli_rs/0.104.0 (Ubuntu 24.4.0; x86_64) gnome-terminal',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        email: data.email || 'codex-cli@user.com',
        userId: data.user_id,
        accountId: data.account_id,
      };
    } else {
      logger.error(
        `Failed to fetch profile: ${response.status} ${await response.text()}`,
      );
    }
  } catch (e) {
    logger.error('Failed to fetch Codex profile:', e);
  }
  return { email: null };
}

export async function loginWithTerminal() {
  logger.info('Starting Codex CLI login with real CLI and terminal...');

  const tempHome = path.join(
    os.homedir(),
    '.elara',
    `codex-login-fresh-${Date.now()}`,
  );
  if (fs.existsSync(tempHome))
    fs.rmSync(tempHome, { recursive: true, force: true });
  fs.mkdirSync(tempHome, { recursive: true });

  // Clear real ~/.codex to ensure fresh login
  const realCodex = path.join(os.homedir(), '.codex');
  try {
    if (fs.existsSync(realCodex)) {
      // Run codex logout first if it exists
      try {
        execSync('codex logout', { stdio: 'ignore' });
      } catch (e) {}
      // Then clear directory
      fs.rmSync(realCodex, { recursive: true, force: true });
    }
  } catch (e) {
    logger.warn('[CLI] Failed to clear real Codex cache:', e);
  }

  // Ensure proxy is running
  await proxyService.start();
  const { port } = proxyService.getServerInfo();
  const logFile = path.join(tempHome, 'codex-cli.log');

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

  const proxyUrl = `http://127.0.0.1:${port}`;
  const caCertPath = path.join(
    os.homedir(),
    '.elara',
    'certs',
    'certs',
    'ca.pem',
  );

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
    NODE_TLS_REJECT_UNAUTHORIZED: '0',
    SSL_CERT_FILE: caCertPath,
    REQUESTS_CA_BUNDLE: caCertPath,
    CURL_CA_BUNDLE: caCertPath,
  };

  const envStr = `export http_proxy=${proxyUrl} https_proxy=${proxyUrl} HTTP_PROXY=${proxyUrl} HTTPS_PROXY=${proxyUrl} all_proxy=${proxyUrl} ALL_PROXY=${proxyUrl} HOME=${tempHome} USERPROFILE=${tempHome} NODE_TLS_REJECT_UNAUTHORIZED=0 SSL_CERT_FILE=${caCertPath} REQUESTS_CA_BUNDLE=${caCertPath} CURL_CA_BUNDLE=${caCertPath};`;
  const commandStr = `${envStr} codex login 2>&1 | tee ${logFile}`;

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
  } else if (terminal) {
    terminalSpawn = spawn(terminal, ['-e', `bash -c "${commandStr}; read"`], {
      detached: true,
      env,
      stdio: 'ignore',
    });
  } else {
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
        const urlMatch = content.match(
          /https:\/\/auth\.openai\.com\/oauth\/authorize\?[^\s"']+/,
        );
        if (urlMatch && !capturedUrl) {
          capturedUrl = urlMatch[0];
          logger.info(`[CLI] Captured Codex login URL: ${capturedUrl}`);
          clearInterval(checkInterval);

          loginService
            .login({
              providerId: 'codex-cli',
              loginUrl: capturedUrl,
              partition: 'codex-cli',
              extraEvents: ['codex-cli-tokens', 'codex-cli-user-info'],
              validate: async (captured) => {
                logger.info('[Codex] Validating captured data...');
                if (captured.cookies) {
                  try {
                    const tokenData = JSON.parse(captured.cookies);
                    const accessToken = tokenData.accessToken;
                    if (accessToken) {
                      logger.info(
                        '[Codex] Token captured, fetching profile proactively...',
                      );
                      const profile = await getProfile(accessToken);
                      if (profile && profile.email) {
                        logger.info(
                          `[Codex] Proactive profile fetch success for ${profile.email}`,
                        );
                        return { isValid: true, email: profile.email };
                      }
                    }
                  } catch (e) {
                    logger.error(
                      '[Codex] Failed to parse captured cookies or fetch profile:',
                      e,
                    );
                  }
                }
                // Fallback to waiting for both if proactive fetch failed
                if (captured.cookies && captured.email) {
                  return { isValid: true };
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
        reject(
          new Error('Timed out waiting for Codex CLI login URL in terminal'),
        );
      }
    }, 60000);
  });
}

export async function refreshToken(refreshToken: string) {
  // Logic from codex-cli-auth.json
  const response = await fetch('https://auth.openai.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: 'app_EMoamEEZ73f0CkXaXp7hrann',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Codex token');
  }

  return await response.json();
}
