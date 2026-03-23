import { exec } from 'child_process';
import fetch from 'node-fetch';
import { createLogger } from '../../utils/logger';

const logger = createLogger('Kiro:API');

export const KIRO_CONFIG = {
  ssoOidcEndpoint: 'https://oidc.us-east-1.amazonaws.com',
  startUrl: 'https://view.awsapps.com/start',
  clientName: 'kiro-oauth-client',
  clientType: 'public',
  scopes: [
    'codewhisperer:completions',
    'codewhisperer:analysis',
    'codewhisperer:conversations',
  ],
  grantTypes: ['urn:ietf:params:oauth:grant-type:device_code', 'refresh_token'],
  issuerUrl: 'https://identitycenter.amazonaws.com/ssoins-722374e8c3c8e6c6',
};

export async function login() {
  logger.info('Starting Kiro login...');

  const region = 'us-east-1';

  // 1. Register Client
  logger.info('Registering OIDC client...');
  const registrationResponse = await fetch(
    `${KIRO_CONFIG.ssoOidcEndpoint}/client/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: KIRO_CONFIG.clientName,
        clientType: KIRO_CONFIG.clientType,
        scopes: KIRO_CONFIG.scopes,
        grantTypes: KIRO_CONFIG.grantTypes,
        issuerUrl: KIRO_CONFIG.issuerUrl,
      }),
    },
  );

  if (!registrationResponse.ok) {
    const err = await registrationResponse.text();
    throw new Error(`Failed to register client: ${err}`);
  }

  const clientData = await registrationResponse.json();
  const { clientId, clientSecret } = clientData;

  // 2. Start Device Authorization
  logger.info('Starting device authorization...');
  const authResponse = await fetch(
    `${KIRO_CONFIG.ssoOidcEndpoint}/device_authorization`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        clientSecret,
        startUrl: KIRO_CONFIG.startUrl,
      }),
    },
  );

  if (!authResponse.ok) {
    const err = await authResponse.text();
    throw new Error(`Failed to start device authorization: ${err}`);
  }

  const deviceData = await authResponse.json();
  const loginUrl =
    deviceData.verificationUriComplete || deviceData.verificationUri;

  // 3. Open Browser
  const startCmd =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';

  logger.info(`Opening browser: ${loginUrl}`);
  exec(`${startCmd} "${loginUrl}"`);

  // 4. Poll for token
  const tokens = await pollDeviceToken(
    clientId,
    clientSecret,
    deviceData.deviceCode,
    deviceData.interval || 5,
  );

  // 5. Extract email from token
  const email = extractEmailFromJWT(tokens.accessToken) || 'kiro-user@aws.com';

  return {
    isValid: true,
    cookies: JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      clientId,
      clientSecret,
      region,
    }),
    email,
  };
}

async function pollDeviceToken(
  clientId: string,
  clientSecret: string,
  deviceCode: string,
  interval: number,
) {
  const maxAttempts = 60;
  const pollInterval = interval * 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const response = await fetch(`${KIRO_CONFIG.ssoOidcEndpoint}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        clientSecret,
        deviceCode,
        grantType: 'urn:ietf:params:oauth:grant-type:device_code',
      }),
    });

    const data = await response.json();

    if (response.ok && !data.error) {
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      };
    }

    if (data.error === 'authorization_pending' || data.error === 'slow_down') {
      if (data.error === 'slow_down') {
        await new Promise((r) => setTimeout(r, 5000));
      }
      continue;
    }

    throw new Error(
      data.error_description || data.error || 'Token polling failed',
    );
  }

  throw new Error('Authorization timeout');
}

export async function refreshToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
  region: string = 'us-east-1',
) {
  const response = await fetch(`https://oidc.${region}.amazonaws.com/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId,
      clientSecret,
      refreshToken,
      grantType: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kiro token refresh failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken || refreshToken,
    expiresIn: data.expiresIn,
  };
}

function extractEmailFromJWT(accessToken: string): string | null {
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.email || payload.preferred_username || payload.sub || null;
  } catch {
    return null;
  }
}
