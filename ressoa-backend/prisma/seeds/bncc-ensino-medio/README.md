# BNCC - Ensino Médio - Seed Data

## Fonte Oficial

**Documento:** Base Nacional Comum Curricular (BNCC) - Ensino Médio
**Versão:** Resolução CNE/CP nº 4, de 17 de dezembro de 2018
**URL:** http://basenacionalcomum.mec.gov.br/images/BNCC_EI_EF_EM_110518_versaofinal_site.pdf
**Páginas EM:** 461-595 (Ensino Médio)

## Estrutura do Ensino Médio

### Áreas de Conhecimento

O Ensino Médio é organizado por **áreas de conhecimento** (não disciplinas isoladas):

1. **Linguagens e suas Tecnologias (LGG)** - ~150 habilidades
   - Inclui: Língua Portuguesa, Artes, Educação Física, Língua Inglesa
   - Códigos: EM13LGG101, EM13LGG102, etc.
   - Páginas BNCC: 481-509

2. **Matemática e suas Tecnologias (MAT)** - ~120 habilidades
   - Códigos: EM13MAT101, EM13MAT102, etc.
   - Páginas BNCC: 519-537

3. **Ciências da Natureza e suas Tecnologias (CNT)** - ~110 habilidades
   - Inclui: Biologia, Física, Química
   - Códigos: EM13CNT101, EM13CNT102, etc.
   - Páginas BNCC: 539-560

4. **Ciências Humanas e Sociais Aplicadas (CHS)** - ~120 habilidades
   - Inclui: História, Geografia, Filosofia, Sociologia
   - Códigos: EM13CHS101, EM13CHS102, etc.
   - Páginas BNCC: 561-588

**Total:** ~500 habilidades

## Estrutura JSON dos Arquivos

Cada arquivo JSON contém habilidades de uma área específica:

```json
{
  "area": "Linguagens e suas Tecnologias",
  "tipo_ensino": "MEDIO",
  "habilidades": [
    {
      "codigo": "EM13LGG101",
      "descricao": "Compreender e analisar processos de produção...",
      "competencia_especifica": 1,
      "anos": [1, 2, 3]
    }
  ]
}
```

### Campos Obrigatórios

- **`codigo`** (string, unique): Código oficial da habilidade (ex: "EM13LGG101")
  - Formato: `EM` (Ensino Médio) + `13` (ano de publicação 2013/2018) + `LGG/MAT/CNT/CHS` (área) + `XYZ` (competência + número sequencial)

- **`descricao`** (string, longa): Texto oficial completo da habilidade conforme BNCC

- **`competencia_especifica`** (number, 1-7): Competência específica da área BNCC
  - LGG: 1-7 competências
  - MAT: 1-5 competências
  - CNT: 1-3 competências
  - CHS: 1-6 competências

- **`anos`** (array): Sempre `[1, 2, 3]` para Ensino Médio
  - Habilidades EM aplicam-se a **todos os 3 anos** simultaneamente (itinerários formativos flexíveis)

## Arquivos Disponíveis

- **`bncc-em-lgg.json`**: Linguagens e suas Tecnologias (~15 habilidades representativas)
- **`bncc-em-mat.json`**: Matemática e suas Tecnologias (~12 habilidades representativas)
- **`bncc-em-cnt.json`**: Ciências da Natureza e suas Tecnologias (~12 habilidades representativas)
- **`bncc-em-chs.json`**: Ciências Humanas e Sociais Aplicadas (~14 habilidades representativas)

**⚠️ NOTA:** Para o MVP, foram incluídas apenas habilidades representativas de cada área (~50 total). Uma implementação completa deve extrair todas as ~500 habilidades do PDF oficial da BNCC.

## Diferenças: Ensino Fundamental vs Ensino Médio

| Aspecto | Ensino Fundamental (6º-9º) | Ensino Médio (1º-3º) |
|---------|---------------------------|----------------------|
| **Organização** | Disciplinas isoladas | Áreas de conhecimento |
| **Granularidade** | Ano específico (6º, 7º, 8º, 9º) | Todos os 3 anos (flexível) |
| **Unidades Temáticas** | Sim (ex: "Números", "Geometria") | Não (substituído por Competências) |
| **Código** | EF06MA01 (ano específico) | EM13LGG101 (área + competência) |
| **Flexibilidade** | Progressão linear | Itinerários formativos |

## Mapeamento Áreas → Disciplinas (MVP)

Para simplificar o MVP, áreas EM são mapeadas para disciplinas existentes:

```typescript
{
  'Linguagens e suas Tecnologias': 'LINGUA_PORTUGUESA',      // MVP: foco em LP
  'Matemática e suas Tecnologias': 'MATEMATICA',
  'Ciências da Natureza e suas Tecnologias': 'CIENCIAS',     // Bio + Fís + Qui
  'Ciências Humanas e Sociais Aplicadas': 'CIENCIAS_HUMANAS' // NOVA disciplina
}
```

## Campos no Banco de Dados

Ao inserir no banco via seed, os campos são mapeados assim:

```typescript
{
  codigo: "EM13LGG101",                              // from JSON
  descricao: "Compreender e analisar...",            // from JSON
  disciplina: mapAreaToDisciplina(area),             // "LINGUA_PORTUGUESA"
  tipo_ensino: 'MEDIO',                              // Always MEDIO for EM
  ano_inicio: 1,                                     // Always 1 for EM
  ano_fim: 3,                                        // Always 3 for EM (all 3 years)
  unidade_tematica: null,                            // NOT used in EM
  competencia_especifica: 1,                         // from JSON (1-7)
  metadata: { area: "Linguagens e suas Tecnologias" }, // Preserves original area
  versao_bncc: "2018",
  ativa: true
}
```

## Processo de Atualização (Futuro)

Se a BNCC for revisada:

1. Baixar nova versão oficial do PDF (com nova URL/versão)
2. Extrair habilidades atualizadas
3. Criar novos JSON files com `versao_bncc: "2024"` (exemplo)
4. Executar seed - o `upsert()` atualizará habilidades existentes ou criará novas
5. Desativar habilidades removidas: `UPDATE habilidades SET ativa = false WHERE codigo IN (...)`

## Validação dos Dados

Antes de commitar alterações:

```bash
# Validar JSON (syntax)
cat bncc-em-lgg.json | jq .

# Verificar campos obrigatórios
jq '.habilidades[] | select(.codigo == null or .descricao == null or .competencia_especifica == null)' bncc-em-*.json

# Verificar unicidade de códigos
jq -r '.habilidades[].codigo' bncc-em-*.json | sort | uniq -d
```

## Referências Técnicas

- **Story 10.3**: Backend - Seeding de Habilidades BNCC do Ensino Médio
- **PRD**: `_bmad-output/planning-artifacts/prd.md`
- **Data Model**: `_bmad-output/planning-artifacts/modelo-de-dados-entidades-2026-02-08.md`
- **Architecture**: `_bmad-output/planning-artifacts/architecture.md` (AD-2.6: Seed idempotente)

---

**Última Atualização:** 2026-02-13
**Extraído por:** Dev Agent (Claude Sonnet 4.5)
**Status:** MVP - Dados representativos (~50/500 habilidades)
