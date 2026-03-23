import { createLogger } from '../utils/logger';
import { configService } from './config.service';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs-extra';

const logger = createLogger('VersionService');

const VERSION_CHECK_URL =
  'https://elara-version.khanhromvn.workers.dev/version';

export class VersionService {
  private currentVersion = '1.1.12'; // Should be synced with package.json

  async checkForUpdates() {
    try {
      const response = await fetch(VERSION_CHECK_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { version: string };

      const remoteVersion = data.version;
      const updateAvailable = remoteVersion !== this.currentVersion;

      return {
        updateAvailable,
        remoteVersion,
        currentVersion: this.currentVersion,
        updateType: updateAvailable ? 'app' : 'none',
      };
    } catch (err) {
      logger.error('Failed to check for updates', err);
      return {
        updateAvailable: false,
        remoteVersion: '',
        currentVersion: this.currentVersion,
        updateType: 'none',
      };
    }
  }

  async performSourceUpdate(): Promise<{ success: boolean; message: string }> {
    logger.info('Starting source update from GitHub...');
    try {
      const treeUrl =
        'https://api.github.com/repos/KhanhRomVN/Elara/git/trees/main?recursive=1';
      const treeResponse = await fetch(treeUrl);
      if (!treeResponse.ok)
        throw new Error(`Failed to fetch git tree: ${treeResponse.statusText}`);
      const treeData = (await treeResponse.json()) as any;

      const filesToUpdate = treeData.tree.filter((item: any) => {
        return (
          item.type === 'blob' &&
          (item.path === 'backend/provider.json' ||
            item.path.startsWith('backend/src/provider/') ||
            item.path.startsWith('src/main/server/provider/'))
        );
      });

      const projectRoot = process.cwd();

      for (const file of filesToUpdate) {
        const rawUrl = `https://raw.githubusercontent.com/KhanhRomVN/Elara/main/${file.path}`;
        const response = await fetch(rawUrl);
        if (!response.ok) {
          logger.warn(`Failed to download ${file.path}`);
          continue;
        }
        const content = await response.text();
        const localPath = path.join(projectRoot, file.path);

        await fs.ensureDir(path.dirname(localPath));
        await fs.writeFile(localPath, content);
        logger.info(`Updated ${file.path}`);
      }

      return { success: true, message: 'Source update completed successfully' };
    } catch (err: any) {
      logger.error('Source update failed', err);
      return { success: false, message: err.message };
    }
  }
}

export const versionService = new VersionService();
