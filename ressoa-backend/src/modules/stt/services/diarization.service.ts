import { Injectable, Logger } from '@nestjs/common';
import { LLMRouterService } from '../../llm/services/llm-router.service';
import type { TranscriptionWord } from '../interfaces/stt-provider.interface';
import type { DiarizationResult, SpeakerStats } from '../interfaces/diarization.interface';

const DIARIZATION_SYSTEM_PROMPT = `Você é um especialista em análise de transcrições de aulas escolares brasileiras.

TAREFA: Receba palavras com timestamps e gere SRT com identificação de falante.

REGRAS DE IDENTIFICAÇÃO:
- PROFESSOR: Explica conceitos, faz perguntas didáticas, dá instruções, usa linguagem formal, cita termos técnicos/BNCC
- ALUNO: Responde perguntas, faz perguntas de dúvida, usa linguagem informal, respostas curtas
- Na DÚVIDA, marque como PROFESSOR (professores falam ~70-80% do tempo)
- Mudanças de speaker coincidem com pausas (gaps > 0.5s entre palavras)

FORMATO SRT (estrito):
Número sequencial
HH:MM:SS,mmm --> HH:MM:SS,mmm
[SPEAKER] texto do segmento

Agrupe palavras consecutivas do mesmo speaker (máx 3 linhas/bloco).
Use vírgula como separador de ms no timestamp.
Responda APENAS com SRT, sem explicações.`;

@Injectable()
export class DiarizationService {
  private readonly logger = new Logger(DiarizationService.name);

  constructor(private readonly llmRouter: LLMRouterService) {}

  async diarize(words: TranscriptionWord[] | undefined): Promise<DiarizationResult> {
    const startTime = Date.now();

    // Fallback: words undefined ou vazio
    if (!words || words.length === 0) {
      this.logger.warn({
        msg: 'Diarization fallback: words undefined or empty',
        words_count: words?.length ?? 0,
      });
      return this.buildFallbackResult(startTime);
    }

    try {
      const formattedInput = this.formatWordsForLLM(words);
      const prompt = `Analise a seguinte transcrição com timestamps e gere SRT com identificação de falantes:\n\n${formattedInput}`;

      const llmResult = await this.llmRouter.generateWithFallback('diarizacao', prompt, {
        temperature: 0.1,
        maxTokens: 8192,
        systemPrompt: DIARIZATION_SYSTEM_PROMPT,
      });

      const srt = llmResult.texto.trim();
      const speakerStats = this.parseSpeakerStats(srt);
      const segmentsCount = this.countSegments(srt);
      const tempoMs = Date.now() - startTime;

      const result: DiarizationResult = {
        srt,
        provider: llmResult.provider,
        custo_usd: llmResult.custo_usd,
        tempo_processamento_ms: tempoMs,
        segments_count: segmentsCount,
        speaker_stats: speakerStats,
      };

      this.logger.log({
        msg: 'Diarization completed successfully',
        segments_count: segmentsCount,
        speaker_stats: speakerStats,
        provider: llmResult.provider,
        custo_usd: llmResult.custo_usd,
        tempo_processamento_ms: tempoMs,
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn({
        msg: 'Diarization fallback: LLM failed',
        error: errorMsg,
        words_count: words.length,
      });
      return this.buildFallbackResult(startTime, words);
    }
  }

  private formatWordsForLLM(words: TranscriptionWord[]): string {
    return words
      .map((w) => {
        const min = Math.floor(w.start / 60);
        const sec = w.start % 60;
        return `[${String(min).padStart(2, '0')}:${sec.toFixed(3).padStart(6, '0')}] ${w.word}`;
      })
      .join('\n');
  }

  private parseSpeakerStats(srt: string): SpeakerStats {
    const lines = srt.split('\n');
    let profSegments = 0;
    let alunoSegments = 0;
    let profTime = 0;
    let alunoTime = 0;

    for (let i = 0; i < lines.length; i++) {
      const timestampMatch = lines[i]?.match(
        /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/,
      );
      if (timestampMatch) {
        const start = this.parseSrtTimestamp(timestampMatch[1]);
        const end = this.parseSrtTimestamp(timestampMatch[2]);
        const duration = end - start;
        const textLine = lines[i + 1] || '';
        if (textLine.startsWith('[PROFESSOR]')) {
          profSegments++;
          profTime += duration;
        } else if (textLine.startsWith('[ALUNO]')) {
          alunoSegments++;
          alunoTime += duration;
        }
      }
    }

    const totalTime = profTime + alunoTime;
    return {
      professor_segments: profSegments,
      aluno_segments: alunoSegments,
      professor_time_pct: totalTime > 0 ? Math.round((profTime / totalTime) * 1000) / 10 : 100,
    };
  }

  private parseSrtTimestamp(ts: string): number {
    const [h, m, sMs] = ts.split(':');
    const [s, ms] = sMs.split(',');
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
  }

  private countSegments(srt: string): number {
    const lines = srt.split('\n');
    let count = 0;
    for (const line of lines) {
      if (/^\d+$/.test(line.trim())) {
        count++;
      }
    }
    return count;
  }

  private buildFallbackResult(
    startTime: number,
    words?: TranscriptionWord[],
  ): DiarizationResult {
    const srt = words && words.length > 0 ? this.buildFallbackSrt(words) : '';
    const segmentsCount = this.countSegments(srt);

    return {
      srt,
      provider: 'FALLBACK',
      custo_usd: 0,
      tempo_processamento_ms: Date.now() - startTime,
      segments_count: segmentsCount,
      speaker_stats: {
        professor_segments: 0,
        aluno_segments: 0,
        professor_time_pct: 100,
      },
    };
  }

  private buildFallbackSrt(words: TranscriptionWord[]): string {
    if (words.length === 0) return '';

    // Group words into segments (~10 words each for readability)
    const segments: { start: number; end: number; text: string }[] = [];
    let currentWords: TranscriptionWord[] = [];

    for (const word of words) {
      currentWords.push(word);
      if (currentWords.length >= 10) {
        segments.push({
          start: currentWords[0].start,
          end: currentWords[currentWords.length - 1].end,
          text: currentWords.map((w) => w.word).join(' '),
        });
        currentWords = [];
      }
    }

    // Remaining words
    if (currentWords.length > 0) {
      segments.push({
        start: currentWords[0].start,
        end: currentWords[currentWords.length - 1].end,
        text: currentWords.map((w) => w.word).join(' '),
      });
    }

    return segments
      .map((seg, i) => {
        const startTs = this.formatSrtTimestamp(seg.start);
        const endTs = this.formatSrtTimestamp(seg.end);
        return `${i + 1}\n${startTs} --> ${endTs}\n${seg.text}`;
      })
      .join('\n\n');
  }

  private formatSrtTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }
}
