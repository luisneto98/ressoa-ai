# Prompts Seed Files

This directory contains versioned AI prompt configurations for the Ressoa AI pedagogical analysis system.

## Overview

Prompts are stored as JSON files and seeded into the database using the `prisma db seed` command. Each prompt represents a specialized task in the 5-prompt serial pipeline that analyzes classroom lessons.

## Prompt Versioning Strategy

We use **semantic versioning** (semver) for prompts:

```
v{MAJOR}.{MINOR}.{PATCH}
```

- **MAJOR**: Breaking changes to output schema or fundamental logic (v1.0.0 → v2.0.0)
- **MINOR**: New features, improved analysis, backward-compatible changes (v1.0.0 → v1.1.0)
- **PATCH**: Bug fixes, typos, clarifications (v1.0.0 → v1.0.1)

### Examples

- `v1.0.0` → Initial release
- `v1.1.0` → Added age-appropriate language detection
- `v1.1.1` → Fixed typo in instructions
- `v2.0.0` → Changed JSON output structure (breaking change)

## File Naming Convention

```
prompt-{name}-v{version}.json
```

**Examples:**
- `prompt-cobertura-v1.0.0.json` - Prompt 1 (BNCC Coverage Analysis)
- `prompt-qualitativa-v1.0.0.json` - Prompt 2 (Qualitative Pedagogical Analysis)
- `prompt-cobertura-v1.1.0.json` - Updated version of Prompt 1

## JSON File Structure

```json
{
  "nome": "prompt-cobertura",
  "versao": "v1.0.0",
  "modelo_sugerido": "CLAUDE_SONNET",
  "ativo": true,
  "ab_testing": false,
  "variaveis": {
    "temperature": 0.3,
    "max_tokens": 2000,
    "transcricao": "string",
    "planejamento": "string",
    "turma": {
      "serie": "number",
      "disciplina": "string"
    }
  },
  "conteudo": "Você é um especialista em análise pedagógica..."
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `nome` | String | Unique prompt name (e.g., "prompt-cobertura") |
| `versao` | String | Semantic version (e.g., "v1.0.0") |
| `modelo_sugerido` | Enum | Recommended LLM model: `CLAUDE_SONNET`, `CLAUDE_OPUS`, `GPT_4_TURBO`, `GPT_4`, `GPT_3_5_TURBO`, `GEMINI_PRO` |
| `ativo` | Boolean | Whether this version is active (can be selected) |
| `ab_testing` | Boolean | If `true`, enables 50/50 split testing with another version |
| `variaveis` | JSON | Schema defining expected input variables + LLM parameters (`temperature`, `max_tokens`) |
| `conteudo` | String | The actual prompt text with `{{variable}}` placeholders |

### Variable Substitution

Prompts use `{{variable}}` syntax for dynamic content:

```markdown
**TRANSCRIÇÃO:** {{transcricao}}
**SÉRIE:** {{turma.serie}}º ano
**DISCIPLINA:** {{turma.disciplina}}
```

At runtime, `PromptService.renderPrompt()` replaces placeholders with actual values.

## How to Add a New Prompt

1. **Create JSON file** in this directory:
   ```bash
   touch prompt-{name}-v1.0.0.json
   ```

2. **Define prompt structure**:
   - Set `nome`, `versao`, `modelo_sugerido`
   - Define `variaveis` schema (include `temperature` and `max_tokens`)
   - Write prompt `conteudo` with clear instructions and examples

3. **Seed script auto-discovers prompts** (`prisma/seed.ts`):
   - All `.json` files in `prisma/seeds/prompts/` are automatically loaded
   - No manual array update needed (Story 5.4 improvement)
   ```typescript
   // Auto-discovery (current implementation)
   const promptFiles = readdirSync(promptsDir)
     .filter(f => f.endsWith('.json'))
     .map(f => join(promptsDir, f));
   ```

4. **Run seed**:
   ```bash
   npx prisma db seed
   ```

5. **Verify in database**:
   ```sql
   SELECT nome, versao, ativo, ab_testing FROM prompt;
   ```

## How to Update an Existing Prompt

### Option A: Patch Existing Version (Not Recommended)

Update the JSON file and re-run seed. The `upsert` logic will overwrite the existing prompt.

⚠️ **WARNING:** This affects ALL future analyses using this prompt. Use only for typo fixes or urgent bugs.

### Option B: Create New Version (Recommended)

1. **Copy existing file**:
   ```bash
   cp prompt-cobertura-v1.0.0.json prompt-cobertura-v1.1.0.json
   ```

2. **Update version field** in new file:
   ```json
   {
     "nome": "prompt-cobertura",
     "versao": "v1.1.0",  // ← Changed
     ...
   }
   ```

3. **Make improvements** to `conteudo` or `variaveis`

4. **Add to seed script** (both versions coexist):
   ```typescript
   const promptFiles = [
     'prisma/seeds/prompts/prompt-cobertura-v1.0.0.json',
     'prisma/seeds/prompts/prompt-cobertura-v1.1.0.json', // ← New version
     ...
   ];
   ```

5. **Activate new version** (deactivate old):
   ```sql
   UPDATE prompt SET ativo = false WHERE nome = 'prompt-cobertura' AND versao = 'v1.0.0';
   UPDATE prompt SET ativo = true WHERE nome = 'prompt-cobertura' AND versao = 'v1.1.0';
   ```

   **OR** keep both active for A/B testing (see below).

6. **Run seed**:
   ```bash
   npx prisma db seed
   ```

## A/B Testing Activation

To test two prompt versions in production with a 50/50 split:

1. **Ensure both versions exist** in database:
   ```sql
   SELECT nome, versao, ativo, ab_testing FROM prompt WHERE nome = 'prompt-cobertura';
   ```

2. **Enable A/B testing** for BOTH versions:
   ```sql
   UPDATE prompt
   SET ativo = true, ab_testing = true
   WHERE nome = 'prompt-cobertura' AND versao IN ('v1.0.0', 'v1.1.0');
   ```

3. **PromptService behavior**:
   - When `ab_testing = true` for multiple versions, `getActivePrompt()` randomly selects one (50/50)
   - The selected version is logged in `Analise.prompt_versoes_json` for tracking
   - After sufficient data (e.g., 100+ analyses), compare quality metrics and promote winning version

4. **Deactivate losing version**:
   ```sql
   UPDATE prompt
   SET ativo = false, ab_testing = false
   WHERE nome = 'prompt-cobertura' AND versao = 'v1.0.0';
   ```

## LLM Parameters

### Temperature Settings

Stored in `variaveis.temperature`:

| Prompt | Temperature | Rationale |
|--------|-------------|-----------|
| Prompt 1 (Cobertura) | 0.3 | Low creativity → deterministic classification, conservative coverage levels |
| Prompt 2 (Qualitativa) | 0.4 | Slight creativity → nuanced pedagogical insights, balanced analysis |
| Prompt 3 (Relatório) | 0.5 | Moderate creativity → engaging narrative while staying factual |
| Prompt 4 (Exercícios) | 0.6 | Higher creativity → diverse exercise generation, creative examples |
| Prompt 5 (Alertas) | 0.3 | Low creativity → accurate pattern detection, no false positives |

**Note:** Prompts 3-4 use GPT-4 mini for cost optimization (~95% cheaper than Claude Sonnet) while maintaining quality.

### Max Tokens Settings

Stored in `variaveis.max_tokens`:

| Prompt | Max Tokens | Rationale |
|--------|------------|-----------|
| Prompt 1 (Cobertura) | 2000 | Enough for 3-5 habilidades with evidences (conservative estimate) |
| Prompt 2 (Qualitativa) | 2500 | 6 dimensions require more output space for detailed analysis |
| Prompt 3 (Relatório) | 1500 | Concise narrative report (800-1200 words) with 5 sections |
| Prompt 4 (Exercícios) | 2000 | 5 contextualized exercises with complete answer keys |
| Prompt 5 (Alertas) | 1500 | Compact alerts with justifications |

## Quality Criteria (90% Usable Target)

All prompts must meet these criteria:

- **Fidelity:** Professor recognizes report is faithful to the lesson (>90% accuracy)
- **Minimal Edits:** Max 2-3 small adjustments (add student name, adjust term)
- **No Rewrites:** Sections do NOT need to be rewritten
- **Measurable:**
  - >80% approval rate (professor approves without changes)
  - <5min review time
  - <3 edits per report
  - <5% rejection rate

## Current Prompts

| Nome | Versão | Modelo | Temp | Max Tokens | Ativo | Descrição |
|------|--------|--------|------|------------|-------|-----------|
| `prompt-cobertura` | v1.0.0 | CLAUDE_SONNET | 0.3 | 2000 | ✅ | Classifies BNCC habilidades coverage (Levels 0-3), extracts literal evidences |
| `prompt-qualitativa` | v1.0.0 | CLAUDE_SONNET | 0.4 | 2500 | ✅ | Analyzes 6 pedagogical dimensions (Bloom, coherence, language, methodology, engagement, clarity) |
| `prompt-relatorio` | v1.0.0 | GPT4_MINI | 0.5 | 1500 | ✅ | Generates teacher-friendly markdown report with 5 sections (coverage, pedagogy, engagement, next steps) |
| `prompt-exercicios` | v1.0.0 | GPT4_MINI | 0.6 | 2000 | ✅ | Creates 5 contextual exercises using lesson examples (Bloom distribution: 2-2-1, progressive difficulty) |

**Planned (Future Stories):**
- `prompt-alertas` (v1.0.0) - Detects pedagogical red flags

## References

- **AI Prompt Strategy Document:** `_bmad-output/planning-artifacts/estrategia-prompts-ia-2026-02-08.md`
- **Bloom's Taxonomy:** https://cft.vanderbilt.edu/guides-sub-pages/blooms-taxonomy/
- **BNCC Official:** http://basenacionalcomum.mec.gov.br/
- **Claude API Docs:** https://docs.anthropic.com/claude/reference
- **Story 5.1 (LLM Service):** `_bmad-output/implementation-artifacts/5-1-backend-llm-service-abstraction-prompt-versioning.md`
- **Story 5.3 (Prompts 1-2):** `_bmad-output/implementation-artifacts/5-3-backend-prompts-1-2-cobertura-bncc-analise-qualitativa.md`
