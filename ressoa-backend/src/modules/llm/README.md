# LLM Module - Abstração Multi-Provider com Versionamento de Prompts

**Story:** 5.1 - Backend LLM Service Abstraction & Prompt Versioning
**Epic:** 5 - AI Analysis Pipeline (Foundation)

## 📋 Visão Geral

Este módulo fornece uma camada de abstração para Large Language Models (LLMs) com suporte a múltiplos providers e sistema de versionamento de prompts com A/B testing.

**Propósito:**
- ✅ Prevenção de vendor lock-in (multi-provider)
- ✅ Otimização de custos (escolha do melhor provider por caso de uso)
- ✅ Melhoria contínua de qualidade (A/B testing de prompts)
- ✅ Rastreabilidade de custos por escola

## 🏗️ Arquitetura

```
src/modules/llm/
├── interfaces/
│   └── llm-provider.interface.ts    # Interface comum para LLM providers
├── providers/
│   ├── claude.provider.ts           # Claude 4.6 Sonnet (análise pedagógica)
│   └── gpt.provider.ts              # GPT-4.6 mini (exercícios contextuais)
├── services/
│   └── prompt.service.ts            # Versionamento & A/B testing
├── llm.module.ts                    # Configuração DI
└── README.md                        # Este arquivo
```

## 🔌 Providers Disponíveis

### Claude Sonnet 4.6 (Análise Pedagógica)
- **Modelo:** `claude-sonnet-4-20250514`
- **Uso:** Análise pedagógica profunda (cobertura BNCC, qualidade, alertas)
- **Custo:** $3/1M input tokens, $15/1M output tokens
- **Token Name:** `CLAUDE_PROVIDER`

### GPT-4.6 mini (Exercícios Contextuais)
- **Modelo:** `gpt-4o-mini`
- **Uso:** Geração de exercícios contextuais
- **Custo:** $0.15/1M input tokens, $0.60/1M output tokens
- **Token Name:** `GPT_PROVIDER`

## ➕ Como Adicionar Novos Providers

Para adicionar um novo LLM provider (ex: GeminiProvider para fallback), siga estes passos:

### 1. Instalar SDK do Provider

```bash
npm install @google/generative-ai
```

### 2. Criar Provider Class

Crie o arquivo `src/modules/llm/providers/gemini.provider.ts` seguindo o padrão de ClaudeProvider/GPTProvider. Implemente a interface `LLMProvider` com os métodos:
- `getName()`: Retorna `ProviderLLM.GEMINI_PRO`
- `generate(prompt, options)`: Chama API, calcula custos, retorna `LLMResult`
- `isAvailable()`: Health check

**IMPORTANTE:**
- Adicionar structured logging em todos métodos
- Calcular custos usando fórmula: `(tokens / 1_000_000) * preço_por_milhão`
- Adicionar comentários inline nas fórmulas de custo (ex: "// Input: $0.50/1M tokens")
- Error handling com contexto: `throw new Error(\`GeminiProvider: Falha - \${error.message}\`)`

### 3. Registrar Provider no LLMModule

```typescript
// src/modules/llm/llm.module.ts
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  providers: [
    // Existing providers
    { provide: 'CLAUDE_PROVIDER', useClass: ClaudeProvider },
    { provide: 'GPT_PROVIDER', useClass: GPTProvider },

    // ✅ New provider
    { provide: 'GEMINI_PROVIDER', useClass: GeminiProvider },

    PromptService,
  ],
  exports: ['CLAUDE_PROVIDER', 'GPT_PROVIDER', 'GEMINI_PROVIDER', PromptService],
})
export class LLMModule {}
```

### 4. Adicionar Variável de Ambiente

```env
# .env
GEMINI_API_KEY=AIzaSy...
```

### 5. Criar Unit Tests

Crie `gemini.provider.spec.ts` seguindo o padrão dos outros providers:
- Mock do SDK usando `jest.mock('@google/generative-ai')`
- Testar `getName()`, `generate()`, `isAvailable()`
- Testar cálculo de custo com diferentes token counts
- Testar error handling
- Coverage >80%

### 6. Atualizar Prisma Schema (se necessário)

Se o `ProviderLLM` enum não tem GEMINI_PRO:

```prisma
enum ProviderLLM {
  CLAUDE_SONNET
  CLAUDE_HAIKU
  GPT4_TURBO
  GPT4_MINI
  GEMINI_PRO      // ✅ Adicionar
  GEMINI_FLASH
}
```

Rodar: `npx prisma migrate dev --name add-gemini-enum`

### 7. Atualizar Documentação

- Adicionar GeminiProvider à seção "Providers Disponíveis" deste README
- Incluir modelo, uso recomendado, custo, token name

---

## 💉 Uso (Dependency Injection)

### Injetando um Provider Específico

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { LLMProvider } from '../llm/interfaces';

@Injectable()
export class AnaliseService {
  constructor(
    @Inject('CLAUDE_PROVIDER') private claude: LLMProvider,
    @Inject('GPT_PROVIDER') private gpt: LLMProvider,
  ) {}

  async gerarAnalise(transcricao: string) {
    // Usar Claude para análise pedagógica
    const result = await this.claude.generate(transcricao, {
      temperature: 0.7,
      maxTokens: 4000,
      systemPrompt: 'Você é um assistente pedagógico...',
    });

    console.log(`Custo: $${result.custo_usd.toFixed(6)}`);
    console.log(`Tempo: ${result.tempo_processamento_ms}ms`);

    return result.texto;
  }
}
```

### Injetando o PromptService

```typescript
import { Injectable } from '@nestjs/common';
import { PromptService } from '../llm/services/prompt.service';

@Injectable()
export class PipelineService {
  constructor(private promptService: PromptService) {}

  async executarPrompt(nomePrompt: string, variaveis: Record<string, any>) {
    // Recupera prompt ativo (com A/B testing se configurado)
    const prompt = await this.promptService.getActivePrompt(nomePrompt);

    // Renderiza template com variáveis
    const promptRendered = await this.promptService.renderPrompt(prompt, variaveis);

    return promptRendered;
  }
}
```

## 📝 Sistema de Versionamento de Prompts

### Estrutura de um Prompt

```typescript
{
  id: "uuid",
  nome: "prompt-cobertura",       // Nome único do prompt
  versao: "v1.1.0",               // Semantic versioning
  conteudo: "Analise: {{transcricao}} para {{habilidade}}",
  variaveis: {                    // Metadata das variáveis esperadas
    transcricao: "string",
    habilidade: "string"
  },
  modelo_sugerido: "CLAUDE_SONNET", // Provider recomendado
  ativo: true,                    // Se está disponível para uso
  ab_testing: true,               // Se faz parte de A/B test
  created_at: "2026-02-11T...",
  updated_at: "2026-02-11T..."
}
```

### Workflow de Versionamento

1. **Criar Versão Inicial (v1.0.0)**
   ```typescript
   await promptService.createPrompt({
     nome: 'prompt-cobertura',
     versao: 'v1.0.0',
     conteudo: 'Analise a cobertura BNCC: {{transcricao}}',
     variaveis: { transcricao: 'string' },
     modelo_sugerido: ProviderLLM.CLAUDE_SONNET,
     ativo: true,
     ab_testing: false,
   });
   ```

2. **Criar Nova Versão com A/B Testing (v1.1.0)**
   ```typescript
   await promptService.createPrompt({
     nome: 'prompt-cobertura',
     versao: 'v1.1.0',
     conteudo: 'Analise MELHORADA: {{transcricao}} e {{planejamento}}',
     variaveis: { transcricao: 'string', planejamento: 'string' },
     ativo: true,
     ab_testing: true, // ✅ Ativa A/B test 50/50 com v1.0.0
   });
   ```

3. **Uso com A/B Testing Automático**
   ```typescript
   // Retorna v1.0.0 ou v1.1.0 aleatoriamente (50/50)
   const prompt = await promptService.getActivePrompt('prompt-cobertura');
   ```

4. **Após Validação - Desativar Versão Antiga**
   ```typescript
   await promptService.updatePromptStatus('prompt-cobertura', 'v1.0.0', {
     ativo: false,
   });

   // Agora sempre retorna v1.1.0
   const prompt = await promptService.getActivePrompt('prompt-cobertura');
   ```

## 🧪 A/B Testing

### Como Funciona

- **2 versões ativas + `ab_testing=true` na mais recente** → Split 50/50 aleatório
- **1 versão ativa** → Sempre retorna essa versão
- **2 versões ativas + `ab_testing=false`** → Sempre retorna a mais recente

### Métricas para Avaliar Prompts

```typescript
// Após análise ser aprovada pelo professor
await prisma.analise.update({
  where: { id: analiseId },
  data: {
    aprovada: true,
    prompt_versao_usada: prompt.versao, // Rastrear qual versão foi usada
    tempo_revisao_segundos: 120,
  },
});

// Query para medir qualidade de prompts
const metricas = await prisma.analise.groupBy({
  by: ['prompt_versao_usada'],
  where: { created_at: { gte: ultimos30Dias } },
  _count: true,
  _avg: { tempo_revisao_segundos: true },
  _sum: { aprovada: true },
});

// Calcular taxa de aprovação por versão
metricas.forEach(m => {
  const taxaAprovacao = (m._sum.aprovada / m._count) * 100;
  console.log(`Versão ${m.prompt_versao_usada}: ${taxaAprovacao}% aprovação`);
});
```

## 💰 Rastreamento de Custos

Todos os providers retornam `LLMResult` com metadados de custo:

```typescript
interface LLMResult {
  texto: string;
  provider: ProviderLLM;      // CLAUDE_SONNET | GPT4_MINI
  modelo: string;             // claude-sonnet-4 | gpt-4o-mini
  tokens_input: number;
  tokens_output: number;
  custo_usd: number;          // ⚠️ CRÍTICO - rastreamento por escola
  tempo_processamento_ms: number;
  metadata?: Record<string, any>;
}
```

**Exemplo de logging de custos:**

```typescript
const result = await this.claude.generate(prompt);

this.logger.log({
  message: 'LLM call completed',
  escola_id: escolaId,
  provider: result.provider,
  custo_usd: result.custo_usd,
  tokens_total: result.tokens_input + result.tokens_output,
});

// Agregar custos por escola para billing
await this.custoService.registrarChamadaLLM({
  escola_id: escolaId,
  provider: result.provider,
  custo_usd: result.custo_usd,
  data: new Date(),
});
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Anthropic API Key (Claude)
ANTHROPIC_API_KEY=sk-ant-api03-...

# OpenAI API Key (GPT)
OPENAI_API_KEY=sk-proj-...
```

### Importação no AppModule

```typescript
import { LLMModule } from './modules/llm/llm.module';

@Module({
  imports: [
    // ...
    LLMModule,
    // ...
  ],
})
export class AppModule {}
```

## 🧪 Testes

### Unit Tests
```bash
# Testar ClaudeProvider
npm test -- claude.provider.spec.ts

# Testar GPTProvider
npm test -- gpt.provider.spec.ts

# Testar PromptService
npm test -- prompt.service.spec.ts
```

### E2E Tests
```bash
# Testar fluxo completo de versionamento e A/B testing
npm run test:e2e -- llm-prompt-versioning.e2e-spec.ts
```

**Cobertura:** >80% em todos os providers e services

## 📊 Health Checks

Verificar disponibilidade dos providers:

```typescript
const claudeDisponivel = await this.claude.isAvailable();
const gptDisponivel = await this.gpt.isAvailable();

if (!claudeDisponivel) {
  this.logger.error('Claude provider indisponível - usar fallback');
}
```

## 🚀 Próximos Passos (Epics Futuros)

- **Story 5.2:** Pipeline serial de 5 prompts orquestrados
- **Story 5.3:** Prompts 1-2 (Cobertura BNCC + Análise Qualitativa)
- **Story 5.4:** Prompts 3-4 (Relatório + Exercícios)
- **Story 5.5:** Prompt 5 + Analysis Worker + Alertas

## 📚 Referências

- [Estratégia de Prompts IA](../../../../_bmad-output/planning-artifacts/estrategia-prompts-ia-2026-02-08.md)
- [Architecture Decision Document](../../../../_bmad-output/planning-artifacts/architecture.md) - Decisões #4, #5, #7
- [Story 4.1 - STT Service Abstraction](../../../../_bmad-output/implementation-artifacts/4-1-backend-stt-service-abstraction-layer.md) - Pattern reference

## ⚠️ Notas Importantes

1. **NUNCA** chamar LLMs sem rastrear custo (`custo_usd`) - impacta billing por escola
2. **SEMPRE** usar `PromptService.getActivePrompt()` - nunca query direta no Prisma
3. **Variáveis faltando** em templates são deixadas como `{{key}}` para debugging
4. **Logging estruturado** é obrigatório (provider, custo, tokens, tempo)
5. **API timeouts:** 2 minutos para LLM calls (vs 5min para STT)

---

**Última Atualização:** 2026-02-12
**Autor:** Dev Agent (Story 5.1)
**Modelo Usado:** Claude Sonnet 4.5
