import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { Provider } from './types';
import { createLogger } from '../utils/logger';
import { providerSyncService } from '../services/provider-sync';
import { proxyService } from '../services/proxy.service';

// Statically import providers that are always available or need special handling
import Gemini from './gemini';
import Cerebras from './cerebras';
import Claude from './claude';
import DeepSeek from './deepseek';
import Groq from './groq';

// Import proxy handlers
import DeepSeekProxy from './deepseek/proxy';
import ClaudeProxy from './claude/proxy';
import GeminiProxy from './gemini/proxy';
import GroqProxy from './groq/proxy';
import MistralProxy from './mistral/proxy';
import HuggingChatProxy from './huggingchat/proxy';
import KimiProxy from './kimi/proxy';
import QwenProxy from './qwen/proxy';
import CerebrasProxy from './cerebras/proxy';

// CLI Provider proxy handlers
import QwenCLIProxy from './qwen-cli/proxy';
import GeminiCLIProxy from './gemini-cli/proxy';
import KiroProxy from './kiro/proxy';
import IFlowProxy from './iflow/proxy';
import CodexCLIProxy from './codex-cli/proxy';

const logger = createLogger('ProviderRegistry');

class ProviderRegistry {
  private providers: Map<string, Provider> = new Map();

  register(provider: Provider) {
    if (this.providers.has(provider.name.toLowerCase())) {
      logger.warn(
        `Provider ${provider.name} is already registered. Overwriting.`,
      );
    }
    this.providers.set(provider.name.toLowerCase(), provider);
    logger.info(`Registered provider: ${provider.name}`);
  }

  getProvider(name: string): Provider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  getAllProviders(): Provider[] {
    return Array.from(this.providers.values());
  }

  getProviderForModel(model: string): Provider | undefined {
    for (const provider of this.providers.values()) {
      if (provider.isModelSupported && provider.isModelSupported(model)) {
        return provider;
      }
    }
    return undefined;
  }

  // Load all providers from the current directory
  async loadProviders() {
    try {
      // Sync providers first (download if needed)
      await providerSyncService.syncProviders();

      // Register statically imported providers
      this.register(Gemini);
      this.register(Cerebras);
      this.register(Claude);
      this.register(DeepSeek);
      this.register(Groq);

      // Register all proxy handlers
      const proxyHandlers = [
        { name: 'DeepSeek', handler: DeepSeekProxy },
        { name: 'Claude', handler: ClaudeProxy },
        { name: 'Gemini', handler: GeminiProxy },
        { name: 'Groq', handler: GroqProxy },
        { name: 'Mistral', handler: MistralProxy },
        { name: 'HuggingChat', handler: HuggingChatProxy },
        { name: 'Kimi', handler: KimiProxy },
        { name: 'Qwen', handler: QwenProxy },
        { name: 'Cerebras', handler: CerebrasProxy },
        // CLI Providers
        { name: 'QwenCLI', handler: QwenCLIProxy },
        { name: 'GeminiCLI', handler: GeminiCLIProxy },
        { name: 'Kiro', handler: KiroProxy },
        { name: 'IFlow', handler: IFlowProxy },
        { name: 'CodexCLI', handler: CodexCLIProxy },
      ];

      for (const { name, handler } of proxyHandlers) {
        if (handler) {
          proxyService.registerHandler(handler);
          logger.info(`Registered ${name} proxy handler`);
        }
      }

      const providerDir = __dirname;
      if (!fs.readdirSync) {
        logger.warn(
          'fs.readdirSync is not available. Skipping automatic provider loading.',
        );
        return;
      }
      const entries = fs.readdirSync(providerDir, { withFileTypes: true });

      for (const entry of entries) {
        try {
          let modulePath = '';

          if (entry.isDirectory()) {
            // Check for index.ts or index.js in subdirectory
            const indexTs = path.join(providerDir, entry.name, 'index.ts');
            const indexJs = path.join(providerDir, entry.name, 'index.js');
            if (fs.existsSync(indexTs)) {
              // ES modules require explicit file extension
              modulePath = path.join(providerDir, entry.name, 'index.ts');
            } else if (fs.existsSync(indexJs)) {
              modulePath = path.join(providerDir, entry.name, 'index.js');
            }
          } else if (
            entry.isFile() &&
            (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) &&
            !entry.name.endsWith('.d.ts') &&
            entry.name !== 'index.ts' &&
            entry.name !== 'types.ts' &&
            entry.name !== 'registry.ts' &&
            // Exclude statically imported providers from dynamic loading
            entry.name !== 'gemini.ts' &&
            entry.name !== 'cerebras.ts' &&
            entry.name !== 'claude.ts' &&
            entry.name !== 'deepseek.ts' &&
            entry.name !== 'mistral.ts' &&
            entry.name !== 'huggingchat.ts' &&
            entry.name !== 'kimi.ts' &&
            entry.name !== 'qwen.ts' &&
            entry.name !== 'qwen-cli.ts' &&
            entry.name !== 'gemini-cli.ts' &&
            entry.name !== 'kiro.ts' &&
            entry.name !== 'iflow.ts'
          ) {
            modulePath = path.join(providerDir, entry.name);
          }

          if (modulePath) {
            // Use require for ts-node compatibility
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const module = require(modulePath);

            if (module.default && module.default.name) {
              this.register(module.default);

              // NEW: Check for corresponding proxy.ts in the same directory
              if (entry.isDirectory()) {
                const proxyTs = path.join(providerDir, entry.name, 'proxy.ts');
                const proxyJs = path.join(providerDir, entry.name, 'proxy.js');
                const proxyPath = fs.existsSync(proxyTs)
                  ? proxyTs
                  : fs.existsSync(proxyJs)
                    ? proxyJs
                    : null;

                if (proxyPath) {
                  try {
                    const proxyModule = require(proxyPath);
                    const handler = proxyModule.default || proxyModule;
                    if (handler) {
                      proxyService.registerHandler(handler);
                      logger.info(
                        `Registered proxy handler for ${module.default.name}`,
                      );
                    }
                  } catch (e) {
                    logger.error(
                      `Failed to load proxy for ${module.default.name}:`,
                      e,
                    );
                  }
                }
              }
            } else {
              // logger.warn is noisy if it picks up non-provider files, but valid for provider folders
              // We can check if it looks like a provider.
              if (entry.isDirectory()) {
                logger.warn(
                  `Directory ${entry.name} does not export a default provider.`,
                );
              }
            }
          }
        } catch (error) {
          logger.error(`Failed to load provider from ${entry.name}`, error);
        }
      }
    } catch (error) {
      logger.warn('Failed to load providers from directory:', error);
    }
  }

  registerAllRoutes(router: Router) {
    this.providers.forEach((provider) => {
      if (provider.registerRoutes) {
        const providerRouter = Router();
        provider.registerRoutes(providerRouter);
        router.use(`/${provider.name.toLowerCase()}`, providerRouter);
        logger.info(`Mounted routes for ${provider.name}`);
      }
    });
  }
}

export const providerRegistry = new ProviderRegistry();
