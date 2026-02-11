# Prisma Database - Ressoa AI

## 📁 Estrutura

```
prisma/
├── schema.prisma          # Schema do banco (modelos, relações, índices)
├── seed.ts                # Script de seeding BNCC
├── validation.sql         # Queries de validação do seed
├── migrations/            # Histórico de migrations
│   └── 20260210233421_create_bncc_tables/
└── seeds/                 # Dados de seed
    └── bncc/              # Habilidades BNCC em JSON
        ├── matematica-6ano.json (34 habs)
        ├── matematica-7ano.json (37 habs)
        ├── matematica-8ano.json (27 habs)
        ├── matematica-9ano.json (23 habs)
        ├── ciencias-6ano.json (14 habs)
        ├── ciencias-7ano.json (16 habs)
        ├── ciencias-8ano.json (16 habs)
        ├── ciencias-9ano.json (17 habs)
        └── lingua-portuguesa-6-9ano.json (92 habs)
```

## 🚀 Como Validar Seeding BNCC

### 1. Executar Seed

```bash
# Método 1: Via Prisma (recomendado)
npx prisma db seed

# Método 2: Diretamente com ts-node
npx ts-node prisma/seed.ts

# Método 3: Reset completo (DESTRÓI DADOS!)
npx prisma migrate reset --force
```

### 2. Validar Dados

**Opção A: Via queries SQL diretas**
```bash
# Executar arquivo de validação completo
docker exec -i ressoa-postgres psql -U ressoa -d ressoa_dev < prisma/validation.sql

# Ou queries individuais
docker exec -i ressoa-postgres psql -U ressoa -d ressoa_dev -c "SELECT COUNT(*) FROM habilidades WHERE ativa = true;"
```

**Resultados da Última Validação (2026-02-10):**
```sql
-- Total habilidades
total_habilidades: 276 ⚠️ (esperado 369, faltam 93)

-- Por disciplina
CIENCIAS: 63 ✅
LINGUA_PORTUGUESA: 92 ⚠️ (esperado ~185, faltam 93)
MATEMATICA: 121 ✅

-- Docker Status
ressoa-postgres: Up 14 hours (healthy) ✅
```

**Opção B: Via Prisma Studio (interface gráfica)**
```bash
npx prisma studio
# Abre em http://localhost:5555
```

### 3. Resultados Esperados

| Métrica | Esperado | Atual | Status |
|---------|----------|-------|--------|
| **Total Habilidades** | 369 | 276 | ⚠️ Faltam 93 |
| Matemática | 121 | 121 | ✅ |
| Ciências | 63 | 63 | ✅ |
| Língua Portuguesa | ~185 | 92 | ⚠️ Faltam 93 |
| Relacionamentos (HabilidadeAno) | ~600 | 314 | ⚠️ |

## ⚠️ Limitações Conhecidas

### Blocos Compartilhados de LP Faltando

O arquivo `lingua-portuguesa-6-9ano.json` está **incompleto**. Faltam:

- **EF69LP** (6º-9º ano): 56 habilidades ❌
- **EF89LP** (8º-9º ano): 37 habilidades ❌

**Impacto:**
- Professores de LP verão apenas ~50% das habilidades oficiais
- Análise de cobertura curricular de LP será imprecisa
- Planejamento bimestral de LP terá opções limitadas

**TODO:**
- [ ] Extrair habilidades EF69LP do documento BNCC oficial
- [ ] Extrair habilidades EF89LP do documento BNCC oficial
- [ ] Adicionar ao arquivo `lingua-portuguesa-6-9ano.json`
- [ ] Re-executar seed: `npx ts-node prisma/seed.ts`
- [ ] Validar: total deve ser 369 habilidades

**Fonte de Dados:**
- Documento primário: `_bmad-output/planning-artifacts/bncc-mapeamento-curricular-2026-02-06.md`
- BNCC oficial: http://basenacionalcomum.mec.gov.br/

## 🔄 Padrão Idempotente

O seed script usa `upsert` para ser **idempotente**:
- Pode ser executado múltiplas vezes sem duplicar dados
- Atualiza registros existentes se houver mudanças
- Usa `codigo` como chave única

```typescript
await prisma.habilidade.upsert({
  where: { codigo: hab.codigo },
  update: { /* atualizar */ },
  create: { /* criar novo */ },
});
```

## 📊 Modelo de Dados BNCC

### Entidades

1. **Disciplina** (3 registros)
   - MATEMATICA, LINGUA_PORTUGUESA, CIENCIAS

2. **Ano** (4 registros)
   - 6_ANO, 7_ANO, 8_ANO, 9_ANO

3. **Habilidade** (369 planejado, 276 atual)
   - Unidade atômica do currículo
   - Código único (ex: EF07MA18)
   - Pode ser específica (1 ano) ou compartilhada (2-4 anos)

4. **HabilidadeAno** (N:N)
   - Relaciona habilidades aos anos que cobrem
   - Blocos compartilhados criam múltiplos registros
   - Exemplo: EF69LP01 → 4 registros (anos 6, 7, 8, 9)

### Exemplos de Habilidades

**Específica (1:1):**
```
EF07MA18 - 7º ano Matemática
→ 1 registro HabilidadeAno (7º ano)
```

**Compartilhada EF67LP (1:2):**
```
EF67LP03 - 6º-7º ano Língua Portuguesa
→ 2 registros HabilidadeAno (6º ano, 7º ano)
```

**Compartilhada EF69LP (1:4):**
```
EF69LP10 - 6º-9º ano Língua Portuguesa
→ 4 registros HabilidadeAno (6º, 7º, 8º, 9º)
```

## 🧪 Testing

### Validação Rápida

```bash
# Total habilidades
docker exec ressoa-postgres psql -U ressoa -d ressoa_dev -c \
  "SELECT COUNT(*) FROM habilidades WHERE ativa = true;"

# Por disciplina
docker exec ressoa-postgres psql -U ressoa -d ressoa_dev -c \
  "SELECT disciplina, COUNT(*) FROM habilidades WHERE ativa = true GROUP BY disciplina;"
```

### Validação Completa

Execute todas as 15 queries de `validation.sql` para verificar:
- Contagem total de habilidades
- Distribuição por disciplina e ano
- Blocos compartilhados de LP
- Integridade referencial
- Relacionamentos N:N

## 📚 Referências

- [Story 0.4: BNCC Curriculum Data Seeding](_bmad-output/implementation-artifacts/0-4-bncc-curriculum-data-seeding.md)
- [Mapeamento BNCC](_bmad-output/planning-artifacts/bncc-mapeamento-curricular-2026-02-06.md)
- [Modelo de Dados](_bmad-output/planning-artifacts/modelo-de-dados-entidades-2026-02-08.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [BNCC Oficial](http://basenacionalcomum.mec.gov.br/)

---

**Última atualização:** 2026-02-10
**Status:** Parcialmente completo (276/369 habilidades)
