import { Injectable, Inject, Logger } from '@nestjs/common';
import type { STTProvider } from '../interfaces';
import { TranscriptionResult, TranscribeOptions } from '../interfaces';
import { ProvidersConfigService } from '../../providers-config/providers-config.service';

@Injectable()
export class STTRouterService {
  private readonly logger = new Logger(STTRouterService.name);
  private readonly providerMap: Map<string, STTProvider>;

  constructor(
    @Inject('WHISPER_PROVIDER') private whisperProvider: STTProvider,
    @Inject('GOOGLE_PROVIDER') private googleProvider: STTProvider,
    private configService: ProvidersConfigService,
  ) {
    this.providerMap = new Map<string, STTProvider>([
      ['WHISPER', this.whisperProvider],
      ['GOOGLE', this.googleProvider],
    ]);
  }

  getSTTProvider(): STTProvider {
    const config = this.configService.getSTTConfig();
    return this.getProviderByKey(config.primary);
  }

  getSTTFallback(): STTProvider {
    const config = this.configService.getSTTConfig();
    return this.getProviderByKey(config.fallback);
  }

  async transcribeWithFallback(
    audioBuffer: Buffer,
    options?: TranscribeOptions,
  ): Promise<TranscriptionResult> {
    const config = this.configService.getSTTConfig();
    const startTime = Date.now();

    // Primary attempt
    try {
      const primary = this.getProviderByKey(config.primary);
      this.logger.log(
        `STT routing: attempting primary provider ${config.primary}`,
      );

      const result = await this.transcribeWithTimeout(
        primary,
        audioBuffer,
        options || {},
        300000,
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        `STT transcription successful: provider=${config.primary}, duration=${duration}ms, cost=$${result.custo_usd}`,
      );
      return result;
    } catch (primaryError) {
      const primaryMsg =
        primaryError instanceof Error ? primaryError.message : 'Unknown error';
      this.logger.warn(
        `STT primary provider ${config.primary} failed: ${primaryMsg}`,
      );

      // Fallback attempt
      try {
        const fallback = this.getProviderByKey(config.fallback);
        this.logger.log(
          `STT routing: attempting fallback provider ${config.fallback}`,
        );

        const result = await this.transcribeWithTimeout(
          fallback,
          audioBuffer,
          options || {},
          300000,
        );

        const duration = Date.now() - startTime;
        this.logger.log(
          `STT fallback successful: provider=${config.fallback}, duration=${duration}ms, cost=$${result.custo_usd}`,
        );
        return result;
      } catch (fallbackError) {
        const fallbackMsg =
          fallbackError instanceof Error
            ? fallbackError.message
            : 'Unknown error';
        this.logger.error(
          `STT all providers failed: primary=${config.primary} (${primaryMsg}), fallback=${config.fallback} (${fallbackMsg})`,
        );
        throw new Error(
          `STT transcription failed on all providers: primary=${config.primary} (${primaryMsg}), fallback=${config.fallback} (${fallbackMsg})`,
        );
      }
    }
  }

  private getProviderByKey(key: string): STTProvider {
    const provider = this.providerMap.get(key);
    if (!provider) {
      throw new Error(
        `Unknown STT provider: ${key}. Available: ${[...this.providerMap.keys()].join(', ')}`,
      );
    }
    return provider;
  }

  private async transcribeWithTimeout(
    provider: STTProvider,
    audioBuffer: Buffer,
    options: TranscribeOptions,
    timeoutMs: number,
  ): Promise<TranscriptionResult> {
    let timer: ReturnType<typeof setTimeout>;
    try {
      return await Promise.race([
        provider.transcribe(audioBuffer, options),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
            timeoutMs,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer!);
    }
  }
}
