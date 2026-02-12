# STT (Speech-to-Text) Module

**Story:** 4.1 - Backend STT Service Abstraction Layer  
**Status:** ✅ COMPLETE (Stub Implementation)  
**Next:** Story 4.2 - Implement Whisper & Google API Integration

---

## Overview

The STT module provides a **multi-provider abstraction layer** for speech-to-text transcription with automatic failover capability. This architecture ensures reliability and cost optimization by using a primary provider (Whisper) with fallback to a secondary provider (Google Cloud Speech-to-Text).

### Key Features

- **Multi-provider support** - Whisper (primary) and Google (fallback)
- **Automatic failover** - Seamless transition between providers on failure
- **Cost optimization** - Primary uses 24% revenue cost, fallback uses 96% (emergency only)
- **Configurable** - Environment-based provider selection
- **Type-safe** - Full TypeScript interfaces and validation
- **Testable** - Mock providers for unit and E2E testing

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 TranscricaoService                  │
│  (Persistence + S3 Download + Orchestration)        │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│                    STTService                       │
│         (Multi-Provider Abstraction Layer)          │
│                                                      │
│  ┌──────────────┐           ┌──────────────┐       │
│  │   Primary    │  Failover │   Fallback   │       │
│  │   Provider   │ ────────> │   Provider   │       │
│  │  (Whisper)   │           │   (Google)   │       │
│  └──────────────┘           └──────────────┘       │
└─────────────────────────────────────────────────────┘
```

### Provider Selection Strategy

**Primary (Whisper):**
- Cost: $0.006/min = **24% of revenue** ✅
- Rate Limit: 50 RPM (bottleneck)
- Model: whisper-1 (large-v3)
- Latency: ~0.5x real-time

**Fallback (Google):**
- Cost: $0.024/min = **96% of revenue** ❌
- Rate Limit: 2,000 RPM (no bottleneck)
- Model: Enhanced v1p1beta1
- Latency: ~0.3x real-time
- **Use only when Whisper fails!**

### Cost Impact (per 1h audio)

| Scenario | Provider | Cost | % Revenue | Margin |
|----------|----------|------|-----------|--------|
| ✅ Normal | Whisper | $0.36 | 24% | 76% |
| ⚠️ Fallback | Google | $1.44 | 96% | 4% |

**Business Rule:** Keep Google usage <5% to maintain >70% margin.

---

## Module Structure

```
src/modules/stt/
├── README.md                    # This file
├── stt.module.ts               # NestJS module definition
├── stt.service.ts              # Multi-provider orchestration
├── transcricao.service.ts      # Persistence + S3 integration
├── interfaces/
│   └── index.ts               # TypeScript interfaces
├── providers/
│   ├── whisper.provider.ts    # OpenAI Whisper (stub)
│   └── google.provider.ts     # Google Cloud STT (stub)
└── __tests__/ (future)
```

---

## Core Interfaces

### `STTProvider`

Base interface all providers must implement:

```typescript
interface STTProvider {
  getName(): ProviderSTT;
  transcribe(
    audioBuffer: Buffer, 
    options?: TranscribeOptions
  ): Promise<TranscriptionResult>;
  isAvailable(): Promise<boolean>;
}
```

### `TranscriptionResult`

Standardized result format across all providers:

```typescript
interface TranscriptionResult {
  texto: string;                    // Transcribed text
  idioma: string;                   // Language code (pt-BR)
  duracao_segundos?: number;        // Audio duration
  confianca?: number;               // Confidence score (0-1)
  custo_usd?: number;              // Processing cost in USD
  tempo_processamento_ms?: number; // Processing time
  provider: ProviderSTT;           // Provider used (WHISPER|GOOGLE|MANUAL)
  metadata?: Record<string, any>;  // Provider-specific data
}
```

**Key Design Decision:** `provider` is in the root (not nested in metadata) for:
- Direct database mapping to `Transcricao.provider` column
- Simpler access in logs and analytics
- Type-safe enum validation

### `TranscribeOptions`

Configuration options for transcription:

```typescript
interface TranscribeOptions {
  idioma?: string;        // Default: 'pt-BR'
  modelo?: string;        // Provider-specific model
  timeout_ms?: number;    // Default: 300000 (5 min)
}
```

---

## Services

### `STTService`

**Responsibility:** Multi-provider orchestration with failover logic.

**Key Methods:**

```typescript
// Transcribe with automatic failover
transcribe(
  audioBuffer: Buffer, 
  options?: TranscribeOptions
): Promise<TranscriptionResult>
```

**Failover Flow:**

1. Try primary provider (Whisper)
2. If fails → Try fallback provider (Google)
3. If both fail → Throw error
4. Log provider used for cost tracking

**Configuration (ENV):**

```bash
STT_PRIMARY_PROVIDER=WHISPER   # Primary provider
STT_FALLBACK_PROVIDER=GOOGLE   # Fallback provider
```

### `TranscricaoService`

**Responsibility:** Database persistence and audio processing orchestration.

**Key Methods:**

```typescript
// Download audio, transcribe, persist to DB
transcribeAula(aulaId: string): Promise<Transcricao>
```

**Flow:**

1. Fetch `Aula` with multi-tenancy validation (`escola_id`)
2. Download audio from S3 via `arquivo_url`
3. Transcribe using `STTService` (handles failover)
4. Save `Transcricao` to database
5. Update `Aula.status_processamento` → `TRANSCRITA`
6. Log cost for tracking (Epic 8 dashboard)

**Multi-tenancy:** Enforced via `Aula.escola_id`, inherited by `Transcricao` FK.

**S3 URL Format:** `s3://bucket-name/path/to/file.mp3`

---

## Provider Implementations

### Story 4.1 (Current) - Stubs

Both providers are **stub implementations** that throw `NotImplementedException`:

```typescript
async transcribe(): Promise<TranscriptionResult> {
  throw new NotImplementedException(
    'WhisperProvider.transcribe() will be implemented in Story 4.2'
  );
}

async isAvailable(): Promise<boolean> {
  return false; // Not available yet
}
```

### Story 4.2 (Next) - Full Implementation

Will implement:
- ✅ OpenAI Whisper API client
- ✅ Google Cloud Speech-to-Text API client
- ✅ Rate limiting (50 RPM for Whisper)
- ✅ Retry logic (3x exponential backoff)
- ✅ Health checks (`isAvailable()`)
- ✅ Cost calculation per minute
- ✅ Metadata extraction (model, confidence)

---

## Testing

### E2E Tests (`test/stt/stt-abstraction.e2e-spec.ts`)

**Coverage:**

✅ Primary provider success (Whisper)  
✅ Fallback on primary failure (Google)  
✅ Error when both providers fail  
✅ Timeout handling with fallback  
✅ Provider configuration validation  

**Mock Providers:**

```typescript
class MockWhisperProvider implements STTProvider {
  // Configurable failure simulation
  setShouldFail(fail: boolean)
  setDelay(ms: number)
  
  // Returns realistic mock data
  async transcribe(): Promise<TranscriptionResult> {
    return {
      texto: 'Transcrição mock do Whisper',
      provider: ProviderSTT.WHISPER,
      custo_usd: 0.012,
      // ... other fields
    };
  }
}
```

**Test Data Setup:**

- Creates test school, professor, turma, planejamento
- Overrides providers with mocks via DI
- Cleans up after tests

**Note:** `TranscricaoService` E2E tests skipped in Story 4.1 due to:
- S3 client mocking complexity
- TenantInterceptor context requirements
- Will be added in Story 4.3 (Worker implementation)

---

## Database Integration

### `Transcricao` Entity

```prisma
model Transcricao {
  id                      String       @id @default(uuid())
  aula_id                 String       @unique
  texto                   String       @db.Text
  provider                ProviderSTT  // WHISPER | GOOGLE | MANUAL
  idioma                  String       @default("pt-BR")
  duracao_segundos        Int?
  confianca               Float?
  custo_usd               Decimal?     @db.Decimal(10,4)
  tempo_processamento_ms  Int?
  metadata_json           Json?
  created_at              DateTime     @default(now())
  updated_at              DateTime     @updatedAt
  
  aula                    Aula         @relation(...)
}

enum ProviderSTT {
  WHISPER
  GOOGLE
  MANUAL  // For manual entry via frontend
}
```

**Multi-tenancy:** Inherited via `Aula.escola_id` FK (no direct `escola_id` column).

---

## Configuration

### Environment Variables

```bash
# STT Provider Configuration
STT_PRIMARY_PROVIDER=WHISPER    # Primary STT provider
STT_FALLBACK_PROVIDER=GOOGLE    # Fallback STT provider

# OpenAI Whisper API
OPENAI_API_KEY=sk-...           # OpenAI API key (Story 4.2)

# Google Cloud Speech-to-Text
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json  # (Story 4.2)

# AWS S3 (for audio download)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=ressoa-uploads
```

### Validation (`src/config/env.ts`)

```typescript
export const envSchema = z.object({
  STT_PRIMARY_PROVIDER: z.enum(['WHISPER', 'GOOGLE']).default('WHISPER'),
  STT_FALLBACK_PROVIDER: z.enum(['WHISPER', 'GOOGLE']).default('GOOGLE'),
  // ... other fields
});
```

---

## Usage Examples

### Basic Transcription (Direct STTService)

```typescript
import { STTService } from './stt.service';

@Injectable()
class MyService {
  constructor(private sttService: STTService) {}
  
  async processAudio(audioBuffer: Buffer) {
    const result = await this.sttService.transcribe(audioBuffer, {
      idioma: 'pt-BR'
    });
    
    console.log(`Provider: ${result.provider}`);
    console.log(`Text: ${result.texto}`);
    console.log(`Cost: $${result.custo_usd}`);
  }
}
```

### Full Aula Transcription (TranscricaoService)

```typescript
import { TranscricaoService } from './transcricao.service';

@Injectable()
class AulasService {
  constructor(private transcricaoService: TranscricaoService) {}
  
  async triggerTranscription(aulaId: string) {
    // Downloads from S3, transcribes, saves to DB
    const transcricao = await this.transcricaoService.transcribeAula(aulaId);
    
    console.log(`Transcription ID: ${transcricao.id}`);
    console.log(`Provider: ${transcricao.provider}`);
    console.log(`Cost: ${transcricao.custo_usd}`);
  }
}
```

### Worker Integration (Story 4.3)

```typescript
// Bull Queue Job Handler
@Processor('transcription')
class TranscriptionWorker {
  @Process('transcribe-aula')
  async handleTranscription(job: Job<{ aulaId: string }>) {
    const { aulaId } = job.data;
    
    try {
      await this.transcricaoService.transcribeAula(aulaId);
      return { success: true };
    } catch (error) {
      // Retry 3x with exponential backoff
      throw error;
    }
  }
}
```

---

## Error Handling

### Provider Failures

```typescript
try {
  const result = await sttService.transcribe(audioBuffer);
} catch (error) {
  if (error.message === 'Transcrição falhou em ambos providers') {
    // Both Whisper and Google failed
    // Log to Sentry, notify admin
  }
}
```

### S3 Download Failures

```typescript
try {
  await transcricaoService.transcribeAula(aulaId);
} catch (error) {
  if (error.message.includes('Falha ao baixar arquivo do S3')) {
    // S3 download failed - check credentials, bucket permissions
  }
}
```

### Aula Not Found

```typescript
try {
  await transcricaoService.transcribeAula(invalidAulaId);
} catch (error) {
  if (error instanceof NotFoundException) {
    // Aula not found or no audio file
  }
}
```

---

## Monitoring & Observability

### Cost Tracking (Epic 8 Dashboard)

Every transcription logs cost metrics:

```typescript
this.logger.log(
  `Transcrição completa: aulaId=${aulaId}, provider=${provider}, custo=$${custo}`
);
```

**Dashboard Metrics:**
- Total transcription cost (daily/monthly)
- Provider usage distribution (Whisper vs Google %)
- Average cost per transcription
- Fallback rate (should be <5%)

### Performance Tracking

Logged metrics:
- `tempo_processamento_ms` - End-to-end processing time
- `duracao_segundos` - Audio duration
- Processing ratio: `tempo_processamento_ms / (duracao_segundos * 1000)`

**Target:** <0.5x real-time for Whisper, <0.3x for Google.

### Health Checks

```typescript
// Check if providers are available
const whisperHealthy = await whisperProvider.isAvailable();
const googleHealthy = await googleProvider.isAvailable();

if (!whisperHealthy && !googleHealthy) {
  // CRITICAL: No STT providers available
  // Alert on-call engineer via Sentry
}
```

---

## Rate Limiting Strategy

### Whisper: 50 RPM Bottleneck

**Problem:** With 600 transcriptions/day and 5min timeout, bursts can exceed 50 RPM.

**Mitigation (Story 4.3):**
1. **Bull Queue** - Serialize requests to <50/min
2. **Retry with backoff** - Exponential backoff on 429 errors
3. **Fallback to Google** - For urgent requests during peak

**Calculation:**
- 600 transcriptions/day = 0.42/min average ✅ (well below 50)
- Peak hour: ~50 transcriptions = 0.83/min ✅
- **No rate limit issues expected** in normal operation

### Google: 2,000 RPM (No Bottleneck)

Used only for fallback, no rate limiting needed.

---

## Security Considerations

### API Key Management

- ✅ Stored in `.env` (never committed)
- ✅ Validated via `envSchema` at startup
- ✅ Injected via `ConfigService` (NestJS best practice)
- ⏳ Story 4.2: Rotate keys quarterly

### Multi-tenancy Isolation

- ✅ `TranscricaoService` validates `escola_id` via `Aula` FK
- ✅ No cross-tenant data leakage possible
- ✅ Prisma RLS enforces database-level isolation

### Audio Data Privacy

- ✅ Audio files stored in S3 with encryption at rest
- ✅ Temporary buffers cleared after transcription
- ⏳ Story 4.2: Implement audio file TTL (90 days)

---

## Future Enhancements

### Story 4.2 - Provider Implementation
- [ ] Implement OpenAI Whisper API client
- [ ] Implement Google Cloud Speech-to-Text client
- [ ] Add rate limiting (Bull queue + throttler)
- [ ] Add retry logic (3x exponential backoff)
- [ ] Implement cost calculation
- [ ] Add health check endpoints

### Story 4.3 - Worker Integration
- [ ] Create `TranscriptionWorker` with Bull
- [ ] Add job status tracking in database
- [ ] Implement retry policy (3x, exponential)
- [ ] Add worker dashboard (Bull Board)
- [ ] Integrate with frontend upload flow

### Story 4.4+ - Advanced Features
- [ ] Add speaker diarization (who spoke when)
- [ ] Support multiple languages beyond pt-BR
- [ ] Add custom vocabulary (BNCC terms)
- [ ] Implement streaming transcription (real-time)
- [ ] Add audio quality validation (min duration, format)

---

## References

### External Documentation
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text/docs)
- [NestJS Dependency Injection](https://docs.nestjs.com/fundamentals/custom-providers)
- [Bull Queue](https://docs.nestjs.com/techniques/queues)

### Internal Documentation
- `_bmad-output/planning-artifacts/external-integrations-api-contracts-2026-02-08.md` (lines 41-76)
- `_bmad-output/planning-artifacts/architecture.md` (lines 127-137, 566-603)
- `_bmad-output/implementation-artifacts/4-1-backend-stt-service-abstraction-layer.md`

### Related Modules
- `src/modules/aulas` - Aula entity and upload flow
- `src/modules/tus` - Resumable upload server (TUS protocol)
- `src/prisma` - Database schema and multi-tenancy

---

## Support

For questions or issues:
1. Check E2E tests for usage examples
2. Review architecture.md for design decisions
3. Consult external-integrations-api-contracts for provider specs
4. Open GitHub issue with `[STT]` prefix

**Maintainer:** Ressoa AI Team  
**Last Updated:** 2026-02-11 (Story 4.1 completion)
