# 📦 ÉPICO 002: Transcrição Enriquecida com Diarização via LLM

**Projeto:** Ressoa AI (Professor Analytics)
**Data de Criação:** 2026-02-15
**Versão:** 1.0
**Status:** 📋 Planejado
**Prioridade:** **P1 - ALTO VALOR**

---

## 📌 Visão Geral

**ID:** EPIC-002
**Título:** Pipeline de Transcrição Enriquecida com Timestamps por Palavra, Prompt Pedagógico e Diarização Professor/Aluno via LLM
**Responsável:** Dev Team
**Estimativa:** 8-12 dias de desenvolvimento

### Problema a Resolver

A transcrição atual é "crua": texto corrido sem marcação temporal por palavra e sem identificação de quem falou (professor vs aluno). Isso limita severamente a qualidade da análise pedagógica downstream:

- A IA não sabe **quem disse o quê** — não consegue diferenciar explicações do professor de respostas/perguntas dos alunos
- Sem timestamps granulares, a IA não consegue correlacionar **momentos da aula** com conteúdos específicos
- Sem prompt de contexto, o STT erra termos pedagógicos e códigos BNCC (ex: "EF06MA01" transcrito como "é éfe zero seis eme a zero um")
- O pipeline de 5 prompts (MOAT técnico) recebe entrada de baixa qualidade, degradando todas as análises subsequentes

### Solução Proposta

Pipeline de enriquecimento em 3 etapas:

1. **STT com Prompt + Word Timestamps** — Enviar vocabulário pedagógico/BNCC como `prompt` e ativar `timestamp_granularities: ["word"]` nos providers Whisper e Groq
2. **Diarização via LLM** — Passar a transcrição com timestamps por palavra para um LLM leve (Gemini Flash, configurável) que identifica `PROFESSOR` vs `ALUNO` por contexto linguístico
3. **Saída em SRT com Speaker Labels** — Salvar no campo `texto` da `Transcricao` em formato SRT enriquecido que os próximos LLMs do pipeline conseguem interpretar nativamente

### Valor de Negócio

- ✅ **Qualidade da análise pedagógica** — LLMs downstream sabem quem falou o quê e quando
- ✅ **Métricas de participação** — Tempo de fala professor vs alunos, frequência de interações
- ✅ **Acurácia da transcrição** — Prompt com vocabulário BNCC reduz erros em termos técnicos
- ✅ **Contexto temporal** — Correlação entre momentos da aula e habilidades trabalhadas
- ✅ **Diferencial competitivo** — Reforça o MOAT técnico (nenhum concorrente oferece análise com diarização)
- ✅ **Custo otimizado** — Gemini Flash para diarização (~$0.01/aula) vs APIs dedicadas de diarização (~$0.10+/aula)

### Exemplo de Saída (SRT Enriquecido)

```srt
1
00:00:01,200 --> 00:00:05,800
[PROFESSOR] Bom dia, turma! Hoje vamos trabalhar com frações equivalentes, habilidade EF06MA01.

2
00:00:06,100 --> 00:00:08,400
[ALUNO] Professor, frações equivalentes é aquilo de pizza?

3
00:00:08,800 --> 00:00:15,200
[PROFESSOR] Exatamente! Vamos começar com exemplos visuais. Quando cortamos uma pizza em 4 pedaços e comemos 2...

4
00:00:15,500 --> 00:00:17,100
[ALUNO] É metade!

5
00:00:17,300 --> 00:00:25,600
[PROFESSOR] Isso! Dois quartos é igual a um meio. Essa é a ideia de equivalência. Vamos ver mais exemplos no quadro.
```

---

## 🏗️ Arquitetura e Decisões Técnicas

### Fluxo do Pipeline

```
┌─────────────────────┐
│  Áudio da Aula      │
└──────────┬──────────┘
           ▼
┌─────────────────────────────────────────┐
│  STT (Whisper/Groq)                     │
│  + prompt: vocabulário pedagógico       │
│  + timestamp_granularities: ["word"]    │
│  → JSON com palavras + timestamps       │
└──────────┬──────────────────────────────┘
           ▼
┌─────────────────────────────────────────┐
│  LLM Diarização (Gemini Flash)          │
│  + Transcrição word-level               │
│  + Prompt de diarização                 │
│  → SRT com [PROFESSOR] / [ALUNO]        │
└──────────┬──────────────────────────────┘
           ▼
┌─────────────────────────────────────────┐
│  Salvar no banco (campo texto)          │
│  formato: SRT enriquecido               │
│  → Input para pipeline de 5 prompts     │
└─────────────────────────────────────────┘
```

### Decisões Técnicas

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Timestamps | Word-level (`timestamp_granularities: ["word"]`) | Granularidade máxima para diarização precisa |
| LLM para diarização | Gemini Flash (configurável via router) | Custo baixíssimo (~$0.01/aula), velocidade, já integrado (Story 14.3) |
| Formato de saída | SRT com speaker labels | Formato padrão que LLMs entendem nativamente, inclui timing |
| Armazenamento | Substituir campo `texto` existente | Formato SRT é superset do texto puro — LLMs conseguem ler ambos |
| Prompt STT | Vocabulário estático por disciplina | Termos BNCC + pedagógicos que o STT erra frequentemente |
| Fallback | Se diarização falhar, salvar SRT sem speakers | Garante que a transcrição nunca é bloqueada pela diarização |

### Alterações no Banco de Dados

**Nenhuma migração necessária.** O campo `texto` (`@db.Text`) na model `Transcricao` já suporta conteúdo SRT. O `metadata_json` armazenará dados adicionais do processo de diarização.

Campos utilizados:
- `texto` — Passa a conter SRT enriquecido (antes: texto puro)
- `metadata_json` — Adiciona: `{ diarization_provider, diarization_cost_usd, diarization_processing_ms, word_count, speaker_segments: { professor: N, aluno: N } }`

---

## 📋 User Stories

### 🔵 US-015.1: Adicionar Prompt de Contexto Pedagógico ao STT

**Como** sistema de transcrição
**Quero** enviar um prompt com vocabulário pedagógico/BNCC ao STT
**Para** melhorar a acurácia na transcrição de termos técnicos educacionais

#### Detalhes Técnicos

O parâmetro `prompt` do Whisper/Groq aceita até 224 tokens (~800 caracteres) para fornecer contexto vocabular. Não é uma instrução — é uma lista de termos que o modelo usa para calibrar a transcrição.

#### Implementação

**Arquivos a modificar:**
- `ressoa-backend/src/modules/stt/providers/whisper.provider.ts`
- `ressoa-backend/src/modules/stt/providers/groq-whisper.provider.ts`

**Prompt por disciplina (exemplos):**

```typescript
const STT_PROMPTS: Record<string, string> = {
  matematica: `Frações, equações, álgebra, geometria, probabilidade, estatística.
Habilidades BNCC: EF06MA01, EF07MA02, EF08MA03, EF09MA04.
Termos: mínimo múltiplo comum, máximo divisor comum, plano cartesiano,
números racionais, expressões algébricas, teorema de Pitágoras.`,

  lingua_portuguesa: `Gêneros textuais, coesão, coerência, morfossintaxe, semântica.
Habilidades BNCC: EF67LP01, EF69LP03, EF89LP05.
Termos: substantivo, adjetivo, advérbio, conjunção, oração subordinada,
figuras de linguagem, dissertação argumentativa, crônica, resenha.`,

  ciencias: `Ecossistema, célula, átomo, molécula, energia, fotossíntese.
Habilidades BNCC: EF06CI01, EF07CI02, EF08CI03, EF09CI04.
Termos: sistema digestório, cadeia alimentar, tabela periódica,
reação química, gravitação, eletromagnetismo, camada de ozônio.`,
};
```

**Código — Whisper Provider (adicionar `prompt`):**

```typescript
const response = await this.openai.audio.transcriptions.create({
  file: fs.createReadStream(tempFilePath),
  model: 'whisper-1',
  language: idioma,
  response_format: 'verbose_json',
  prompt: sttPrompt, // NOVO: contexto pedagógico
});
```

#### Critérios de Aceitação

- [ ] Whisper provider aceita parâmetro `prompt` opcional na chamada de transcrição
- [ ] Groq Whisper provider aceita parâmetro `prompt` opcional na chamada de transcrição
- [ ] Prompt de vocabulário é selecionado com base na disciplina da aula (via `Planejamento` → `Disciplina`)
- [ ] Prompt default (genérico) usado quando disciplina não está disponível
- [ ] Prompt não excede 224 tokens (~800 chars) — validado em build time
- [ ] Sem regressão nos testes existentes de transcrição
- [ ] Log do prompt utilizado no metadata da transcrição

---

### 🔵 US-015.2: Ativar Timestamps por Palavra no STT

**Como** sistema de transcrição
**Quero** receber timestamps no nível de cada palavra (não apenas segmento)
**Para** fornecer granularidade temporal precisa à etapa de diarização

#### Detalhes Técnicos

Ambas as APIs (OpenAI Whisper e Groq) suportam o parâmetro `timestamp_granularities` que aceita `["word"]`, `["segment"]` ou `["word", "segment"]`. Quando ativado com `verbose_json`, a resposta inclui um array `words[]` com `{ word, start, end }` para cada palavra.

#### Implementação

**Arquivos a modificar:**
- `ressoa-backend/src/modules/stt/providers/whisper.provider.ts`
- `ressoa-backend/src/modules/stt/providers/groq-whisper.provider.ts`
- `ressoa-backend/src/modules/stt/interfaces/stt-provider.interface.ts`

**Código — Whisper Provider:**

```typescript
const response = await this.openai.audio.transcriptions.create({
  file: fs.createReadStream(tempFilePath),
  model: 'whisper-1',
  language: idioma,
  response_format: 'verbose_json',
  prompt: sttPrompt,
  timestamp_granularities: ['word', 'segment'], // NOVO
});
```

**Interface TranscriptionResult — Adicionar campo `words`:**

```typescript
export interface TranscriptionWord {
  word: string;
  start: number; // segundos
  end: number;   // segundos
}

export interface TranscriptionResult {
  texto: string;
  words?: TranscriptionWord[]; // NOVO: timestamps por palavra
  provider: ProviderSTT;
  idioma: string;
  duracao_segundos?: number;
  confianca?: number;
  custo_usd: number;
  tempo_processamento_ms: number;
  metadata?: Record<string, any>;
}
```

#### Critérios de Aceitação

- [ ] Whisper provider solicita `timestamp_granularities: ['word', 'segment']`
- [ ] Groq Whisper provider solicita `timestamp_granularities: ['word', 'segment']`
- [ ] `TranscriptionResult` inclui array `words` com `{ word, start, end }` por palavra
- [ ] Array `words` é populado corretamente pelos dois providers
- [ ] Campo `texto` continua sendo preenchido normalmente (compatibilidade)
- [ ] Testes unitários verificam parsing do array `words`
- [ ] Google provider não é afetado (não suporta word-level — ignora graciosamente)

---

### 🔵 US-015.3: Implementar Serviço de Diarização via LLM

**Como** sistema de processamento de aulas
**Quero** passar a transcrição word-level para um LLM que identifica professor vs aluno
**Para** gerar um SRT enriquecido com identificação de falantes

#### Detalhes Técnicos

O serviço recebe o array de `TranscriptionWord[]` e usa um LLM (default: Gemini Flash) para:
1. Agrupar palavras em frases/turnos de fala
2. Classificar cada turno como `[PROFESSOR]` ou `[ALUNO]`
3. Gerar saída em formato SRT com speaker labels e timestamps

#### Implementação

**Novo arquivo:**
- `ressoa-backend/src/modules/stt/services/diarization.service.ts`

**Prompt de Diarização:**

```typescript
const DIARIZATION_PROMPT = `Você é um especialista em análise de transcrições de aulas escolares brasileiras.

ENTRADA: Transcrição com timestamps por palavra de uma aula escolar.

TAREFA:
1. Agrupe as palavras em frases/turnos de fala naturais
2. Identifique quem está falando: PROFESSOR ou ALUNO
3. Formate a saída em SRT com labels de speaker

REGRAS DE IDENTIFICAÇÃO:
- PROFESSOR: Explica conceitos, faz perguntas didáticas, dá instruções, usa linguagem formal, cita termos técnicos/BNCC
- ALUNO: Responde perguntas, faz perguntas de dúvida, usa linguagem informal, respostas curtas
- Na DÚVIDA, marque como PROFESSOR (professores falam ~70-80% do tempo em aulas expositivas)
- Mudanças de speaker geralmente coincidem com pausas (gaps > 0.5s entre palavras)

FORMATO DE SAÍDA (SRT estrito):
- Cada bloco: número sequencial, timestamp (HH:MM:SS,mmm --> HH:MM:SS,mmm), [SPEAKER] texto
- Agrupe palavras consecutivas do mesmo speaker em um bloco (máx 3 linhas por bloco)
- Use vírgula (não ponto) como separador de milissegundos no timestamp SRT

Responda APENAS com o SRT, sem explicações.`;
```

**Fluxo do Serviço:**

```typescript
@Injectable()
export class DiarizationService {
  constructor(
    private readonly llmRouter: LLMRouterService,
    private readonly config: ProvidersConfigService,
  ) {}

  async diarize(words: TranscriptionWord[], disciplina?: string): Promise<DiarizationResult> {
    const provider = this.config.getDiarizationLLMProvider(); // NOVO config
    const wordText = this.formatWordsForLLM(words);

    const response = await this.llmRouter.complete({
      provider,
      prompt: DIARIZATION_PROMPT,
      input: wordText,
      temperature: 0.1, // Baixa criatividade para classificação
      maxTokens: 4096,
    });

    return {
      srt: response.text,
      provider,
      custo_usd: response.cost,
      tempo_processamento_ms: response.duration,
    };
  }

  private formatWordsForLLM(words: TranscriptionWord[]): string {
    return words
      .map(w => `[${this.formatTime(w.start)}] ${w.word}`)
      .join('\n');
  }
}
```

#### Critérios de Aceitação

- [ ] Serviço `DiarizationService` criado no módulo STT
- [ ] Recebe `TranscriptionWord[]` e retorna SRT com speaker labels
- [ ] Usa LLM Router existente para chamada ao provider configurado
- [ ] Provider de diarização é configurável (default: Gemini Flash)
- [ ] Prompt identifica corretamente `[PROFESSOR]` e `[ALUNO]` em cenários típicos
- [ ] Output é SRT válido (parseable por bibliotecas padrão)
- [ ] Custo e tempo de processamento são rastreados no resultado
- [ ] Fallback: se LLM falhar, retorna SRT sem labels (apenas timestamps + texto)
- [ ] Timeout de 60s para a chamada LLM (aulas longas geram input grande)
- [ ] Log estruturado com métricas de diarização (segmentos professor/aluno)

---

### 🔵 US-015.4: Configuração do Provider de Diarização

**Como** administrador do sistema
**Quero** configurar qual LLM é usado para diarização
**Para** controlar custo e qualidade da identificação de speakers

#### Implementação

**Arquivo a modificar:**
- `ressoa-backend/src/config/env.ts` (ou equivalente de configuração de providers)

**Novas variáveis de ambiente:**

```env
# Diarization LLM Provider
DIARIZATION_LLM_PROVIDER=GEMINI_FLASH       # GEMINI_FLASH | CLAUDE | OPENAI
DIARIZATION_ENABLED=true                      # true | false (feature flag)
DIARIZATION_FALLBACK_PROVIDER=OPENAI          # Fallback se primário falhar
```

**Integração com ProvidersConfigService:**

```typescript
getDiarizationLLMProvider(): string {
  return this.configService.get('DIARIZATION_LLM_PROVIDER', 'GEMINI_FLASH');
}

isDiarizationEnabled(): boolean {
  return this.configService.get('DIARIZATION_ENABLED', 'true') === 'true';
}

getDiarizationFallbackProvider(): string {
  return this.configService.get('DIARIZATION_FALLBACK_PROVIDER', 'OPENAI');
}
```

#### Critérios de Aceitação

- [ ] Variáveis `DIARIZATION_LLM_PROVIDER`, `DIARIZATION_ENABLED`, `DIARIZATION_FALLBACK_PROVIDER` adicionadas ao `.env.example`
- [ ] `ProvidersConfigService` expõe métodos para acessar configuração de diarização
- [ ] Validação: provider configurado deve existir no LLM Router
- [ ] Feature flag `DIARIZATION_ENABLED` permite desabilitar diarização (salva transcrição sem speakers)
- [ ] Documentação das variáveis no `.env.example`

---

### 🔵 US-015.5: Integrar Pipeline Completo (STT → Diarização → Salvar)

**Como** professor que faz upload de áudio
**Quero** que minha transcrição seja automaticamente enriquecida com diarização
**Para** que as análises pedagógicas saibam quem disse o quê

#### Detalhes Técnicos

Integrar as stories anteriores no fluxo existente de processamento de aulas. O pipeline roda no Bull queue worker, de forma assíncrona.

#### Fluxo Atualizado

```
Audio Upload → Bull Queue → STT (com prompt + word timestamps)
                                    ↓
                            DiarizationService (LLM)
                                    ↓
                            Salvar Transcricao {
                              texto: SRT enriquecido,
                              metadata_json: {
                                ...existente,
                                diarization_provider: "GEMINI_FLASH",
                                diarization_cost_usd: 0.008,
                                diarization_processing_ms: 3200,
                                word_count: 1847,
                                speaker_stats: {
                                  professor_segments: 42,
                                  aluno_segments: 18,
                                  professor_time_pct: 74.2
                                },
                                stt_prompt_used: "matematica",
                                has_diarization: true
                              }
                            }
                                    ↓
                            Status: TRANSCRITA → (pipeline análise continua)
```

#### Critérios de Aceitação

- [ ] Após transcrição STT, diarização é executada automaticamente (se `DIARIZATION_ENABLED=true`)
- [ ] Campo `texto` da `Transcricao` salvo em formato SRT com speaker labels
- [ ] `metadata_json` inclui métricas de diarização (provider, custo, stats de speakers)
- [ ] Se diarização falhar, transcrição é salva em SRT sem labels (fallback gracioso — não bloqueia pipeline)
- [ ] Se `DIARIZATION_ENABLED=false`, transcrição salva em formato SRT simples (com timestamps, sem speakers)
- [ ] Custo total (STT + diarização) rastreado corretamente
- [ ] Tempo total de processamento logado (STT + diarização separados)
- [ ] Status da aula transiciona corretamente: `AGUARDANDO_TRANSCRICAO → TRANSCRITA`
- [ ] Pipeline de análise downstream (5 prompts) recebe e interpreta SRT corretamente

---

### 🔵 US-015.6: Atualizar Prompts de Análise para Consumir SRT

**Como** pipeline de análise pedagógica
**Quero** interpretar transcrições em formato SRT com speaker labels
**Para** gerar análises que diferenciam falas do professor e dos alunos

#### Detalhes Técnicos

Os 5 prompts do pipeline de análise (Cobertura → Qualitativa → Relatório → Exercícios → Alertas) precisam ser atualizados para:
1. Reconhecer o formato SRT de entrada
2. Usar as labels `[PROFESSOR]` e `[ALUNO]` na análise
3. Aproveitar timestamps para contextualizar momentos da aula

#### Critérios de Aceitação

- [ ] Prompts de análise reconhecem e interpretam formato SRT
- [ ] Análise diferencia contribuições do professor vs alunos
- [ ] Timestamps são usados para referenciar momentos específicos da aula
- [ ] Compatibilidade mantida: se receber texto puro (legado), ainda funciona
- [ ] Relatórios gerados incluem insights de participação (% fala professor/aluno)

---

## 📊 Estimativa de Custo por Aula

| Etapa | Provider | Custo Estimado |
|-------|----------|----------------|
| STT (45min áudio) | Groq Whisper Large v3 Turbo | ~$0.03 |
| Diarização (~2000 palavras) | Gemini Flash | ~$0.008 |
| **Total adicional** | | **~$0.01** (apenas diarização é custo novo) |

**Impacto mensal (100 aulas/escola):** ~R$6/mês adicional — desprezível vs receita de R$1.200/mês.

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| LLM erra diarização (professor como aluno) | Média | Médio | Default para PROFESSOR em caso de dúvida; threshold de confiança; feedback loop |
| Áudio com muitos alunos falando simultaneamente | Alta | Baixo | LLM marca como `[ALUNO]` genérico — suficiente para análise |
| Prompt STT degrada transcrição em vez de melhorar | Baixa | Médio | A/B testing com e sem prompt; rollback via config |
| SRT quebra pipeline de análise existente | Baixa | Alto | Compatibilidade backward: prompts aceitam texto puro ou SRT |
| Custo Gemini Flash aumenta | Baixa | Baixo | Provider configurável — troca para outro LLM sem code change |

---

## 🔗 Dependências

- **EPIC-001** (Gestão de Cadastros) — Não bloqueador direto
- **Story 14.3** (Gemini Flash Provider) — ✅ Já implementada
- **Story 14.4** (Provider Router) — ✅ Já implementada
- **Pipeline de Análise** (5 prompts) — US-015.6 atualiza os prompts

---

## 📈 Métricas de Sucesso

| Métrica | Baseline (Atual) | Target |
|---------|------------------|--------|
| Acurácia de termos BNCC na transcrição | ~85% (estimativa) | >95% |
| Acurácia diarização professor/aluno | N/A | >90% |
| Custo adicional por aula | $0 | <$0.02 |
| Tempo adicional de processamento | 0s | <15s (diarização) |
| Qualidade da análise pedagógica (NPS) | Baseline a medir | +10 pontos |
| Taxa de aprovação de relatórios | Baseline a medir | +15% |

---

## 📋 Ordem de Implementação

```
US-015.1 (Prompt STT) ──┐
                         ├──→ US-015.3 (Diarização LLM) ──→ US-015.5 (Integração Pipeline) ──→ US-015.6 (Atualizar Prompts Análise)
US-015.2 (Word Timestamps)┘                                        ▲
                                                                   │
US-015.4 (Config Provider) ────────────────────────────────────────┘
```

**Paralelizáveis:** US-015.1 + US-015.2 (independentes), US-015.4 (independente)
**Sequenciais:** US-015.3 depende de US-015.2 → US-015.5 depende de US-015.3 + US-015.4 → US-015.6 depende de US-015.5
