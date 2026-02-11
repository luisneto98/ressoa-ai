# Documento de Integrações Externas e Contratos de API

**Projeto:** Professor Analytics
**Versão:** 1.0 (MVP)
**Data:** 2026-02-08
**Status:** Em Revisão
**Documentos Relacionados:**
- Product Brief (2026-02-05)
- Brainstorming Session (2026-02-05)
- Business Rules - Pedagogical Analysis (2026-02-06)
- BNCC Mapeamento Curricular (2026-02-06)

---

## 1. Objetivo e Escopo

Este documento mapeia todas as integrações externas necessárias para o Professor Analytics, definindo:

- **Contratos de API** para cada provedor (inputs, outputs, limites)
- **Custos operacionais** por hora de aula processada
- **Estratégias de fallback** e redundância
- **Abstrações para anti vendor lock-in**
- **Rate limits e planejamento de capacidade**
- **Métricas de qualidade esperada** por tipo de integração

### 1.1. Princípios Arquiteturais

1. **Agnóstico ao Provedor:** Camada de abstração permite trocar provedores de IA sem refatorar a lógica de negócio
2. **Processamento Assíncrono:** Batch jobs noturnos ou low-priority para otimizar custos
3. **Degradação Graciosa:** Sistema funciona com qualidade reduzida se provedor primário falhar
4. **Custo < 40% da Receita:** Meta operacional para viabilidade do negócio

---

## 2. Speech-to-Text (STT)

O sistema precisa transcrever áudio de aulas capturadas em diversos ambientes (sala de aula com ruído, celular, dispositivo dedicado).

### 2.1. Provedores Avaliados

| Provedor | Modelo | Idioma PT-BR | Pontuação | Diarização | Custo/hora | Qualidade |
|----------|--------|--------------|-----------|------------|------------|-----------|
| **OpenAI Whisper** | large-v3 | Sim (nativo) | Sim | Não (beta) | $0.006/min = **$0.36/h** | ⭐⭐⭐⭐⭐ |
| **Google Speech-to-Text** | Enhanced | Sim | Sim | Sim (extra) | $0.024/min = **$1.44/h** | ⭐⭐⭐⭐⭐ |
| **Azure Speech** | Standard | Sim | Sim | Sim | $1.00/h = **$1.00/h** | ⭐⭐⭐⭐ |
| **Deepgram** | Nova-2 | Sim | Sim | Sim | $0.0125/min = **$0.75/h** | ⭐⭐⭐⭐ |

**Decisão de arquitetura:** Usar **Whisper como primário** (custo 75% menor) com **Google Speech como fallback** para áudios problemáticos.

### 2.2. Formatos de Áudio Aceitos

| Formato | Suportado | Taxa de Amostragem Recomendada | Observações |
|---------|-----------|-------------------------------|-------------|
| MP3 | ✅ | 128 kbps+ | Formato universal, boa compressão |
| M4A | ✅ | 128 kbps+ | Padrão do iOS (gravador nativo) |
| WAV | ✅ | 16 kHz+ | Sem perdas, arquivos grandes |
| OGG | ✅ | 96 kbps+ | Android padrão |
| WEBM | ✅ | 128 kbps+ | Gravação de navegadores |

**Limites técnicos:**
- **Duração máxima por arquivo:** 25 MB (Whisper) / 1 hora (Google)
- **Tamanho máximo:** 25 MB (Whisper) / 10 MB via REST (Google)
- **Latência esperada:** 0.5x tempo real (áudio de 1h = ~30 min de processamento)

### 2.3. Qualidade Esperada por Tipo de Gravação

| Tipo de Gravação | WER Esperado | Qualidade | Recomendação |
|------------------|--------------|-----------|--------------|
| **Celular em sala silenciosa** | 5-10% | ⭐⭐⭐⭐ | Suficiente para MVP |
| **Celular em sala com ruído moderado** | 10-20% | ⭐⭐⭐ | Aceitável, pode precisar de revisão |
| **Celular em sala ruidosa (30+ alunos)** | 20-35% | ⭐⭐ | Problemático, considerar fallback |
| **Dispositivo dedicado (microfone direcional)** | 3-8% | ⭐⭐⭐⭐⭐ | Meta para V2 com hardware próprio |
| **Gravação de plataforma (Read.ai, Zoom)** | 5-10% | ⭐⭐⭐⭐ | Alta qualidade, já processado |

**WER = Word Error Rate** (taxa de erro por palavra)

### 2.4. Contrato de API — Speech-to-Text

#### Input
```json
{
  "audio_file": "base64_encoded_audio | url_to_audio",
  "language": "pt-BR",
  "format": "mp3 | m4a | wav | ogg | webm",
  "enable_punctuation": true,
  "enable_diarization": false,  // MVP não usa
  "model": "whisper-1 | google-enhanced | azure-standard"
}
```

#### Output (Normalizado)
```json
{
  "transcription_id": "uuid",
  "text": "Texto completo transcrito da aula...",
  "confidence": 0.92,  // 0-1
  "duration_seconds": 3600,
  "word_count": 4500,
  "provider": "whisper",
  "metadata": {
    "model_version": "large-v3",
    "processing_time_seconds": 180,
    "detected_language": "pt-BR",
    "audio_quality": "good | fair | poor"
  },
  "warnings": [
    "High background noise detected (0:15-0:45)",
    "Low audio quality in segment 3"
  ]
}
```

### 2.5. Lógica de Fallback

```
┌─────────────────────────────────────────────┐
│ 1. Tentar Whisper (primário)                │
│    └─> Sucesso: usar resultado              │
│    └─> Falha: ir para Google Speech         │
├─────────────────────────────────────────────┤
│ 2. Tentar Google Speech (fallback)          │
│    └─> Sucesso: usar resultado              │
│    └─> Falha: retornar erro + notificar     │
├─────────────────────────────────────────────┤
│ 3. Se ambos falharem:                       │
│    - Notificar professor                     │
│    - Oferecer upload manual de transcrição  │
│    - Log para investigação                   │
└─────────────────────────────────────────────┘
```

**Regra RN-STT-01:** Se `confidence < 0.75`, alertar o professor que a qualidade da transcrição pode estar comprometida e oferecer revisão manual.

**Regra RN-STT-02:** Áudios com `duration_seconds / word_count < 0.6` (menos de 0.6s por palavra) indicam problema de segmentação e devem disparar alerta de qualidade.

### 2.6. Unit Economics — STT

Para uma escola de **10 salas** processando **800 horas/mês** (10 turmas × 4h × 20 dias):

| Provedor | Custo/hora | Custo Total Mensal | % da Receita (R$1.200) |
|----------|------------|--------------------|------------------------|
| Whisper (primário) | $0.36 | $288 (~R$1.440 @ R$5) | **24%** ✅ |
| Google Speech | $1.44 | $1.152 (~R$5.760 @ R$5) | **96%** ❌ |
| Azure Speech | $1.00 | $800 (~R$4.000 @ R$5) | **67%** ❌ |

**Meta:** Whisper como primário mantém STT em ~24% da receita, deixando espaço para custos de LLM.

---

## 3. Large Language Models (LLM) para Análise Pedagógica

O coração do produto é a análise pedagógica por IA: cruzar transcrições com planejamento, detectar gaps, gerar relatórios e exercícios.

### 3.1. Provedores Avaliados

| Provedor | Modelo | Custo Input ($/1M tokens) | Custo Output ($/1M tokens) | Contexto | Qualidade Análise Pedagógica |
|----------|--------|---------------------------|----------------------------|----------|------------------------------|
| **OpenAI** | GPT-4.6 Turbo | $2.50 | $10.00 | 128k | ⭐⭐⭐⭐⭐ |
| **OpenAI** | GPT-4.6 mini | $0.15 | $0.60 | 128k | ⭐⭐⭐⭐ |
| **Anthropic** | Claude 4.6 Sonnet | $3.00 | $15.00 | 200k | ⭐⭐⭐⭐⭐ |
| **Anthropic** | Claude Haiku 4.5 | $0.25 | $1.25 | 200k | ⭐⭐⭐⭐ |
| **Google** | Gemini 1.5 Pro | $1.25 | $5.00 | 2M | ⭐⭐⭐⭐ |
| **Google** | Gemini 1.5 Flash | $0.075 | $0.30 | 1M | ⭐⭐⭐ |

**Decisão de arquitetura:**
- **Análise pedagógica principal:** Claude 4.6 Sonnet (contexto maior, melhor raciocínio)
- **Geração de exercícios:** GPT-4.6 mini (custo 20x menor, tarefa mais simples)
- **Fallback universal:** Gemini 1.5 Pro (custo intermediário, bom desempenho)

### 3.2. Estimativa de Tokens por Aula

Uma aula típica de **50 minutos** gera:

| Componente | Tokens Estimados | Observações |
|------------|------------------|-------------|
| **Transcrição da aula** | ~6.000 | 4.500 palavras × 1.33 tokens/palavra |
| **Planejamento bimestral** | ~800 | Contexto BNCC + tópicos |
| **Prompt de análise** | ~1.200 | Instruções + exemplos few-shot |
| **Output: Relatório** | ~1.500 | Relatório estruturado (formato escola) |
| **Output: Análise de gaps** | ~800 | Lista de gaps + justificativas |
| **Output: Exercícios** | ~2.000 | 5-10 exercícios contextualizados |
| **Total input** | ~8.000 | |
| **Total output** | ~4.300 | |

### 3.3. Tipos de Análise e Modelos Recomendados

| Tipo de Análise | Modelo Recomendado | Justificativa | Custo Estimado/Aula |
|-----------------|-------------------|---------------|---------------------|
| **Cruzamento planejamento × transcrição** | Claude 4.6 Sonnet | Raciocínio complexo, contexto longo | ~$0.10 |
| **Detecção de gaps e cobertura** | Claude 4.6 Sonnet | Requer compreensão pedagógica profunda | ~$0.08 |
| **Geração de relatório estruturado** | GPT-4.6 mini | Template-based, pode usar modelo menor | ~$0.004 |
| **Geração de exercícios contextuais** | GPT-4.6 mini | Tarefa criativa, mas modelo menor suficiente | ~$0.006 |
| **Análise de sinais de dificuldade** | Claude Haiku 4.5 | Busca de padrões em interações | ~$0.008 |
| **Sugestões para próxima aula** | GPT-4.6 mini | Baseado em gaps já identificados | ~$0.004 |

**Custo total estimado por aula processada:** ~$0.22 (**R$1.10** @ R$5/USD)

### 3.4. Contrato de API — LLM Analysis

#### Input Principal: Análise de Cobertura
```json
{
  "analysis_type": "coverage_analysis",
  "lesson_data": {
    "transcription": "Texto completo da aula...",
    "date": "2026-02-08",
    "duration_minutes": 50,
    "class": "7º ano A"
  },
  "planning_data": {
    "bimester": 1,
    "subject": "Matemática",
    "grade": "7º ano",
    "topics": [
      {
        "name": "Equações do 1º grau",
        "subtopics": ["Conceito", "Resolução", "Problemas"],
        "weight": 0.3,
        "bncc_codes": ["EF07MA18"]
      }
    ]
  },
  "previous_coverage": {
    "topics_status": {
      "Números inteiros": "COVERED",
      "Frações": "PARTIAL"
    }
  },
  "model_preference": "claude-sonnet",
  "output_language": "pt-BR"
}
```

#### Output Normalizado
```json
{
  "analysis_id": "uuid",
  "lesson_summary": {
    "main_topic_covered": "Equações do 1º grau - Introdução ao conceito",
    "teaching_approach": "Expositiva com exemplos práticos",
    "estimated_content_depth": "intermediate"
  },
  "coverage_analysis": {
    "topics": [
      {
        "topic_name": "Equações do 1º grau",
        "status": "PARTIAL",
        "coverage_percentage": 50,
        "covered_subtopics": ["Conceito", "Resolução"],
        "missing_subtopics": ["Problemas"],
        "evidence": [
          {
            "quote": "Uma equação é uma igualdade que contém uma incógnita...",
            "timestamp_range": "0:05-0:12",
            "relevance": "Definição conceitual clara"
          }
        ],
        "justification": "Professor introduziu conceito e resolveu 3 exemplos, mas não chegou em problemas aplicados."
      }
    ],
    "overall_coverage_percentage": 62.5,
    "cumulative_coverage_percentage": 68.0
  },
  "gaps_detected": [
    {
      "topic": "Equações do 1º grau",
      "gap_type": "incomplete",
      "severity": "medium",
      "description": "Subtópico 'Problemas' não foi abordado",
      "suggestion": "Próxima aula: aplicar equações em problemas contextualizados"
    }
  ],
  "difficulty_signals": [
    {
      "timestamp": "0:25",
      "signal_type": "repeated_question",
      "description": "3 alunos perguntaram sobre isolamento da incógnita",
      "severity": "medium",
      "recommendation": "Considerar exercício adicional sobre isolamento de termos"
    }
  ],
  "metadata": {
    "model_used": "claude-sonnet-4-6",
    "processing_time_seconds": 12,
    "confidence_score": 0.88,
    "token_usage": {
      "input_tokens": 8200,
      "output_tokens": 1800
    }
  }
}
```

### 3.5. Prompts Especializados (Moat Técnico)

O diferencial competitivo está na **engenharia de prompts pedagógicos** construída com especialistas em educação.

#### Exemplo: Prompt de Análise de Cobertura
```
Você é um especialista em análise pedagógica e conhece profundamente a BNCC (Base Nacional Comum Curricular) brasileira.

CONTEXTO:
- Professor: [nome]
- Série: [7º ano]
- Disciplina: [Matemática]
- Data da aula: [2026-02-08]

PLANEJAMENTO DO BIMESTRE:
[JSON com tópicos, pesos, competências BNCC]

TRANSCRIÇÃO DA AULA:
[Texto completo]

SUA TAREFA:
1. Classificar cada tópico do planejamento como COVERED, PARTIAL ou GAP
2. Para cada classificação, fornecer:
   - Justificativa baseada em evidências da transcrição
   - Citações literais (com timestamp aproximado se possível)
   - Grau de profundidade com que o tópico foi abordado

CRITÉRIOS DE CLASSIFICAÇÃO:
COVERED = Pelo menos 2 de: (explicação conceitual, exemplos, exercícios propostos, discussão/interação)
PARTIAL = Apenas 1 dos critérios acima, ou menção superficial
GAP = Nenhum critério presente, ou apenas menção prospectiva

IMPORTANTE:
- Seja rigoroso mas justo — não espere perfeição, mas substância
- Se o professor abordou de forma diferente do planejado mas atingiu os objetivos, considere COVERED
- Cite evidências específicas, não faça afirmações genéricas
- Use taxonomia de Bloom para avaliar profundidade cognitiva

OUTPUT ESPERADO:
[JSON estruturado conforme schema]
```

### 3.6. Estratégias de Otimização de Custo

| Estratégia | Economia Esperada | Trade-off |
|------------|-------------------|-----------|
| **Processamento assíncrono (batch noturno)** | ~30% | Relatório disponível em D+1, não tempo real |
| **Modelos diferentes por tarefa** | ~60% | Exercícios com GPT-4.6 mini em vez de Sonnet |
| **Caching de análises de BNCC** | ~15% | Contexto BNCC reutilizado, não enviado sempre |
| **Compressão de transcrições antigas** | ~20% | Transcrições >30 dias sumarizadas para análise cumulativa |
| **Rate limiting inteligente** | ~10% | Agrupar análises por escola/horário |

**Meta combinada:** Reduzir custo de **$0.22/aula → $0.15/aula** (R$0.75 @ R$5/USD) = **12.5% da receita/hora**

### 3.7. Unit Economics — LLM

Para escola de **10 salas** com **800 horas/mês**:

| Componente | Custo/Aula (50min) | Aulas/Mês | Custo Mensal |
|------------|---------------------|-----------|--------------|
| Análise pedagógica (Claude) | $0.18 | 400 | $72 |
| Geração de exercícios (GPT-4.6 mini) | $0.006 | 400 | $2.40 |
| Sugestões e alertas (Haiku) | $0.008 | 400 | $3.20 |
| **Total LLM** | **$0.194** | **400** | **$77.60** |
| **Total LLM (em R$)** | **R$0.97** | **400** | **R$388** |

**% da receita:** R$388 / R$1.200 = **32.3%**

**Total STT + LLM:** R$1.440 + R$388 = **R$1.828** = **30.5% da receita** ✅
*(Abaixo da meta de 40%)*

---

## 4. Read.ai e Plataformas de Transcrição Externa

### 4.1. Integração com Read.ai

Read.ai é uma plataforma que transcreve reuniões automaticamente (Zoom, Google Meet, Teams). Professores que já usam podem importar transcrições diretamente.

#### Formato de Importação
```json
{
  "source": "read_ai",
  "meeting_data": {
    "title": "Aula de Matemática - 7º A",
    "date": "2026-02-08T10:00:00Z",
    "duration_minutes": 50,
    "participants": ["Prof. João", "Aluno 1", "Aluno 2", "..."]
  },
  "transcription": {
    "full_text": "Texto completo...",
    "segments": [
      {
        "speaker": "Prof. João",
        "text": "Hoje vamos falar sobre equações...",
        "timestamp": "0:00"
      }
    ]
  },
  "read_ai_metadata": {
    "summary": "Aula introdutória sobre equações do 1º grau",
    "topics": ["Matemática", "Álgebra", "Equações"],
    "action_items": []
  }
}
```

#### Vantagens
- **Custo zero de STT** (Read.ai já transcreveu)
- **Qualidade alta** (ambiente online controlado)
- **Metadados adicionais** (resumo, tópicos já extraídos)

#### Limitações
- **Dependência de conexão** (só funciona se aula é online ou híbrida)
- **Privacidade** (dados passam por terceiro)
- **Custo externo** (escola precisa pagar Read.ai separadamente, ~$20/user/mês)

### 4.2. Outras Plataformas Suportadas

| Plataforma | Formato de Export | Suporte MVP | Observações |
|------------|-------------------|-------------|-------------|
| **Read.ai** | JSON API | ✅ | Integração direta |
| **Zoom** | VTT/SRT | ✅ | Parser de legendas |
| **Google Meet** | TXT | ✅ | Texto plano, sem timestamps |
| **Otter.ai** | JSON export | 🔄 | Planejado pós-MVP |
| **Microsoft Teams** | VTT | 🔄 | Planejado pós-MVP |

---

## 5. Estratégia Anti Vendor Lock-in

### 5.1. Camada de Abstração

Criar uma **Service Layer** que desacopla a lógica de negócio dos provedores de IA.

```
┌──────────────────────────────────────────────┐
│         Application Layer                     │
│  (Análise Pedagógica, Geração de Relatórios)│
└──────────────────┬───────────────────────────┘
                   │
┌──────────────────▼───────────────────────────┐
│      AI Service Abstraction Layer            │
│  ┌──────────────┐  ┌────────────────────┐   │
│  │ STTService   │  │ LLMAnalysisService │   │
│  └──────┬───────┘  └─────────┬──────────┘   │
└─────────┼────────────────────┼──────────────┘
          │                    │
    ┌─────▼─────┐        ┌─────▼─────┐
    │  STT      │        │  LLM      │
    │ Providers │        │ Providers │
    ├───────────┤        ├───────────┤
    │ Whisper   │        │ Claude    │
    │ Google    │        │ GPT-4     │
    │ Azure     │        │ Gemini    │
    └───────────┘        └───────────┘
```

### 5.2. Interface de Contrato

#### STTService Interface
```python
class STTService(ABC):
    @abstractmethod
    async def transcribe(
        self,
        audio_file: bytes,
        language: str = "pt-BR",
        options: Dict[str, Any] = None
    ) -> TranscriptionResult:
        """
        Transcreve áudio para texto.

        Returns:
            TranscriptionResult com campos normalizados:
            - text: str
            - confidence: float
            - duration_seconds: int
            - provider: str
            - metadata: Dict
        """
        pass

    @abstractmethod
    def get_cost_per_hour(self) -> float:
        """Retorna custo por hora em USD"""
        pass

    @abstractmethod
    def get_rate_limits(self) -> RateLimitInfo:
        """Retorna informações de rate limits do provedor"""
        pass
```

#### LLMAnalysisService Interface
```python
class LLMAnalysisService(ABC):
    @abstractmethod
    async def analyze_coverage(
        self,
        transcription: str,
        planning: PlanningData,
        previous_coverage: Optional[CoverageData] = None
    ) -> CoverageAnalysisResult:
        """Analisa cobertura curricular"""
        pass

    @abstractmethod
    async def generate_report(
        self,
        analysis: CoverageAnalysisResult,
        template: ReportTemplate
    ) -> str:
        """Gera relatório estruturado"""
        pass

    @abstractmethod
    async def generate_exercises(
        self,
        transcription: str,
        topics: List[str],
        difficulty: str = "medium"
    ) -> List[Exercise]:
        """Gera exercícios contextuais"""
        pass

    @abstractmethod
    def estimate_cost(self, input_tokens: int, output_tokens: int) -> float:
        """Estima custo da operação em USD"""
        pass
```

### 5.3. Implementações Concretas

Cada provedor implementa a interface:

- `WhisperSTTService`
- `GoogleSTTService`
- `AzureSTTService`
- `ClaudeLLMService`
- `OpenAILLMService`
- `GeminiLLMService`

### 5.4. Provider Switching Strategy

```python
# Configuração centralizada
AI_PROVIDERS_CONFIG = {
    "stt": {
        "primary": "whisper",
        "fallback": ["google", "azure"],
        "selection_strategy": "cost_optimized"  # ou "quality_first", "latency_first"
    },
    "llm": {
        "coverage_analysis": "claude",
        "exercise_generation": "openai-mini",
        "fallback": "gemini"
    }
}
```

**Regra RN-VENDOR-01:** Trocar provedor deve exigir apenas mudança de configuração, zero refatoração de código de negócio.

**Regra RN-VENDOR-02:** Logs devem rastrear qual provedor processou cada análise para auditoria de custos e qualidade.

---

## 6. Rate Limits e Quotas

### 6.1. Limites por Provedor (Tier Pago)

#### Speech-to-Text

| Provedor | RPM (Requests/min) | Concurrent Requests | Monthly Quota |
|----------|-------------------|---------------------|---------------|
| **Whisper (OpenAI)** | 50 | 5 | Ilimitado |
| **Google Speech** | 2.000 | 200 | Ilimitado (pago por uso) |
| **Azure Speech** | 100 | 20 | Ilimitado (pago por uso) |

#### LLM

| Provedor | TPM (Tokens/min) | RPM | Concurrent Requests |
|----------|------------------|-----|---------------------|
| **Claude 4.6 Sonnet** | 400.000 | 50 | 5 |
| **GPT-4.6 Turbo** | 300.000 | 500 | 10 |
| **GPT-4.6 mini** | 2.000.000 | 5.000 | 50 |
| **Gemini 1.5 Pro** | 4.000.000 | 360 | 30 |

### 6.2. Planejamento de Capacidade

Para **100 escolas** × **800 horas/mês** = **80.000 horas/mês processadas**:

#### Carga de Trabalho Estimada
- **80.000 horas** = **~40.000 aulas** (50 min/aula)
- **Processamento assíncrono:** distribuir em janela de 12h noturnas (20h às 8h)
- **~3.300 aulas/hora** = **55 aulas/min**

#### Necessidades de Throughput

| Serviço | Carga/min | TPM Necessário | Provedor Limite | Status |
|---------|-----------|----------------|-----------------|--------|
| STT | 55 áudios | - | Whisper: 50 RPM | ⚠️ **GARGALO** |
| LLM Coverage | 55 análises (~450k tokens) | 450.000 | Claude: 400k TPM | ⚠️ **GARGALO** |
| LLM Exercises | 55 gerações (~100k tokens) | 100.000 | GPT-4.6 mini: 2M TPM | ✅ OK |

**Conclusão:** Com 100 escolas, precisamos de:
1. **2 contas Whisper** (50 RPM cada) ou migrar para Google Speech
2. **2 contas Claude** (400k TPM cada) ou distribuir carga em janela maior (18h)
3. Implementar **queue system** com controle de rate limit

### 6.3. Sistema de Filas (Queue Management)

```
┌─────────────────────────────────────────────┐
│         Job Queue (Redis/Bull)              │
├─────────────────────────────────────────────┤
│  Priority 1: Pilotos e escolas VIP          │
│  Priority 2: Escolas regulares              │
│  Priority 3: Reprocessamento                │
└──────────────┬──────────────────────────────┘
               │
        ┌──────▼──────┐
        │  Rate Limiter│
        │  (Bottleneck)│
        └──────┬───────┘
               │
    ┌──────────▼──────────────┐
    │   Worker Pool            │
    │  ┌────┐ ┌────┐ ┌────┐  │
    │  │W1  │ │W2  │ │W3  │  │
    │  └────┘ └────┘ └────┘  │
    └─────────────────────────┘
```

**Regra RN-QUEUE-01:** Aulas devem ser processadas em até 12 horas após upload (D+1 manhã).

**Regra RN-QUEUE-02:** Escolas em piloto têm prioridade máxima na fila.

**Regra RN-QUEUE-03:** Se fila exceder 24h de backlog, escalar automaticamente (adicionar workers ou contas de API).

---

## 7. Monitoramento e Observabilidade

### 7.1. Métricas Operacionais

| Métrica | Threshold de Alerta | Ação |
|---------|---------------------|------|
| **STT Error Rate** | > 5% | Investigar qualidade de áudio ou provedor |
| **LLM Timeout Rate** | > 2% | Aumentar timeout ou trocar modelo |
| **Cost per Lesson** | > $0.30 | Revisar estratégias de otimização |
| **Queue Processing Time** | > 12h | Escalar workers ou rate limits |
| **Provider Downtime** | > 5 min | Ativar fallback automaticamente |

### 7.2. Logs Estruturados

Cada processamento deve gerar:
```json
{
  "lesson_id": "uuid",
  "school_id": "uuid",
  "timestamp": "2026-02-08T10:00:00Z",
  "pipeline": {
    "stt": {
      "provider": "whisper",
      "duration_seconds": 180,
      "cost_usd": 0.36,
      "confidence": 0.92,
      "word_count": 4500
    },
    "llm_analysis": {
      "provider": "claude-sonnet",
      "input_tokens": 8200,
      "output_tokens": 1800,
      "cost_usd": 0.18,
      "processing_time_seconds": 12
    },
    "llm_exercises": {
      "provider": "gpt-4-mini",
      "input_tokens": 1200,
      "output_tokens": 2000,
      "cost_usd": 0.006,
      "processing_time_seconds": 4
    }
  },
  "total_cost_usd": 0.546,
  "total_processing_time_seconds": 196,
  "status": "success"
}
```

### 7.3. Dashboard de Custos

KPIs para acompanhamento executivo:
- **Custo médio por aula** (meta: < $0.30)
- **% de STT vs LLM** no custo total
- **Distribuição de uso por provedor**
- **Economia via caching e otimização**
- **Projeção de custo mensal vs receita**

---

## 8. Plano de Migração e Contingência

### 8.1. Cenários de Risco

| Risco | Probabilidade | Impacto | Plano de Mitigação |
|-------|--------------|---------|-------------------|
| **Aumento de 50% no preço do Claude** | Média | Alto | Migrar análises para Gemini 1.5 Pro (economia de 58%) |
| **Whisper API descontinuada** | Baixa | Muito Alto | Migração imediata para Google Speech (custo +300%) |
| **Rate limits não suportam escala** | Alta | Alto | Multi-conta + queue management |
| **Qualidade do STT abaixo do esperado** | Média | Médio | Oferecer upload manual de transcrição como alternativa |
| **Claude fica indisponível** | Baixa | Alto | Fallback automático para Gemini 1.5 Pro |

### 8.2. Plano de Rollback

Se um provedor apresentar problemas:

1. **Detecção automática:** Sistema detecta error rate > 10% em 5 min
2. **Fallback imediato:** Redireciona tráfego para provedor secundário
3. **Notificação:** Alerta equipe de engenharia via PagerDuty/Slack
4. **Análise pós-incidente:** Review de logs e atualização de runbook

**Regra RN-CONTINGENCY-01:** Todo provedor crítico (STT, LLM) deve ter fallback configurado e testado mensalmente.

---

## 9. Roadmap de Integrações

### 9.1. MVP (Fase 1 - Meses 0-3)

- ✅ Whisper STT (primário)
- ✅ Google Speech STT (fallback)
- ✅ Claude 4.6 Sonnet (análise)
- ✅ GPT-4.6 mini (exercícios)
- ✅ Read.ai import (JSON)
- ✅ Upload manual de transcrição

### 9.2. V2 (Fase 2 - Meses 4-6)

- 🔄 Diarização de voz (identificar professor vs alunos)
- 🔄 Integração Zoom nativa
- 🔄 Integração Google Meet nativa
- 🔄 Fine-tuning de modelo para análise pedagógica
- 🔄 Otimização de prompts baseada em feedback real

### 9.3. V3 (Fase 3 - Meses 7-12)

- 📋 Modelo próprio (fine-tuned) para análise pedagógica
- 📋 Identificação individual de alunos por voz
- 📋 Análise de sentimento e engajamento por aluno
- 📋 Integração com sistemas de gestão escolar (Sponte, ClassApp)
- 📋 API pública para terceiros

---

## 10. Anexos

### 10.1. Glossário de Termos

| Termo | Definição |
|-------|-----------|
| **WER** | Word Error Rate - Taxa de erro de transcrição por palavra |
| **TPM** | Tokens Per Minute - Throughput de tokens processados por minuto |
| **RPM** | Requests Per Minute - Taxa de requisições por minuto |
| **STT** | Speech-to-Text - Conversão de áudio para texto |
| **LLM** | Large Language Model - Modelo de linguagem grande |
| **Diarização** | Identificação de diferentes falantes em um áudio |
| **Rate Limit** | Limite de taxa de requisições imposto pelo provedor |

### 10.2. Referências

- **OpenAI API Documentation:** https://platform.openai.com/docs
- **Anthropic API Documentation:** https://docs.anthropic.com/
- **Google Speech-to-Text:** https://cloud.google.com/speech-to-text/docs
- **BNCC (Base Nacional Comum Curricular):** http://basenacionalcomum.mec.gov.br/

### 10.3. Histórico de Revisões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-02-08 | Luisneto98 | Documento inicial completo |

---

**Status:** 🟡 **EM REVISÃO** — Aguardando validação de Arquitetura e PRD para alinhamento final.

**Próximos passos:**
1. Validar custos reais com POC (Proof of Concept) usando 5-10 transcrições reais
2. Testar qualidade de STT em diferentes ambientes (celular vs dispositivo dedicado)
3. Refinar prompts de análise pedagógica com especialista em educação
4. Definir SLA de processamento para contratos comerciais
