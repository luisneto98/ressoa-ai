import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { watch, existsSync, FSWatcher } from 'fs';
import {
  ProvidersConfig,
  LLMAnalysisType,
  loadProvidersConfig,
  ProvidersConfigSchema,
  DEFAULT_PROVIDERS_CONFIG,
} from '../../config/providers.config';
import { readFileSync } from 'fs';
import { z } from 'zod';

@Injectable()
export class ProvidersConfigService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProvidersConfigService.name);
  private config: ProvidersConfig;
  private watcher: FSWatcher | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private configPath: string;

  constructor() {
    this.configPath =
      process.env.PROVIDERS_CONFIG_PATH || 'providers.config.json';
    this.config = DEFAULT_PROVIDERS_CONFIG;
  }

  onModuleInit(): void {
    this.config = loadProvidersConfig(this.configPath);
    this.startFileWatcher();
  }

  onModuleDestroy(): void {
    this.stopFileWatcher();
  }

  getSTTConfig(): ProvidersConfig['stt'] {
    return this.config.stt;
  }

  getLLMConfig(analysisType: LLMAnalysisType): { primary: string; fallback: string } {
    return this.config.llm[analysisType];
  }

  getConfig(): ProvidersConfig {
    return this.config;
  }

  private startFileWatcher(): void {
    if (!existsSync(this.configPath)) {
      this.logger.log(
        `Config file "${this.configPath}" not found. Hot-reload will activate when file is created.`,
      );
      return;
    }

    try {
      this.watcher = watch(this.configPath, () => {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
          this.reloadConfig();
        }, 1000);
      });

      this.watcher.on('error', (error) => {
        this.logger.warn(
          `File watcher error for "${this.configPath}": ${error.message}. Hot-reload disabled.`,
        );
      });

      this.logger.log(`File watcher started for "${this.configPath}"`);
    } catch {
      this.logger.warn(
        `Could not watch "${this.configPath}". Hot-reload disabled.`,
      );
    }
  }

  private stopFileWatcher(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  private reloadConfig(): void {
    try {
      const raw = readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      const validated = ProvidersConfigSchema.parse(parsed);

      this.config = validated;
      this.logger.log(
        `Providers config hot-reloaded from "${this.configPath}" (version: ${validated.version})`,
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.error(
          `Invalid config on reload: ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}. Keeping previous config.`,
        );
      } else {
        this.logger.error(
          `Failed to reload config: ${error instanceof Error ? error.message : 'Unknown error'}. Keeping previous config.`,
        );
      }
    }
  }
}
