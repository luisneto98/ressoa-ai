# Guia do Usuário: Cursos Customizados

**Última atualização:** 2026-02-13
**Versão:** 1.0.0
**Feature:** Epic 11 - Suporte a Cursos Não-BNCC

---

## 📋 Índice

1. [Introdução](#introdução)
2. [Quando Usar Cursos Customizados](#quando-usar-cursos-customizados)
3. [Criar Turma Customizada](#criar-turma-customizada)
4. [Definir Objetivos de Aprendizagem](#definir-objetivos-de-aprendizagem)
5. [Criar Planejamento com Objetivos Customizados](#criar-planejamento-com-objetivos-customizados)
6. [Análise de Aulas Customizadas](#análise-de-aulas-customizadas)
7. [Boas Práticas](#boas-práticas)
8. [Diferenças entre BNCC e Cursos Custom](#diferenças-entre-bncc-e-cursos-custom)

---

## Introdução

O Ressoa AI agora suporta **Cursos Customizados**, permitindo que escolas criem e acompanhem cursos fora da BNCC, como:

- Preparatórios para concursos (PM, ENEM, vestibulares)
- Cursos de idiomas (Inglês, Espanhol, Francês)
- Cursos técnicos (TI, Enfermagem, Administração)
- Treinamentos corporativos

Nestes cursos, você define **Objetivos de Aprendizagem customizados** em vez de usar habilidades BNCC pré-definidas.

---

## Quando Usar Cursos Customizados

### Use Cursos Customizados quando:

✅ Curso **não se enquadra na BNCC** (preparatórios, idiomas, técnicos)
✅ Necessita de **objetivos específicos** ao contexto do aluno
✅ Quer **análise pedagógica adaptada** ao seu currículo

### Use BNCC quando:

✅ Curso é **Ensino Fundamental II ou Ensino Médio** regular
✅ Quer acompanhar **habilidades BNCC** diretamente
✅ Necessita **comparação nacional** de cobertura curricular

---

## Criar Turma Customizada

### Passo a Passo

#### 1. Acesse Gestão de Turmas

- No menu lateral, clique em **"Turmas"**
- Clique em **"Nova Turma"**

#### 2. Preencha o Formulário

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Nome** | Nome identificador da turma | "Preparatório PM - Matemática 2026" |
| **Tipo de Ensino** | Selecione **"LIVRE"** | LIVRE |
| **Currículo** | Selecione **"CUSTOM"** | CUSTOM |
| **Contexto Pedagógico** | Descrição do objetivo do curso (**obrigatório** para CUSTOM) | "Preparação para prova da Polícia Militar, foco em raciocínio lógico e matemática básica" |

**⚠️ Importante:**
- O campo **Contexto Pedagógico** é **obrigatório** para turmas CUSTOM (mínimo 20 caracteres)
- Este contexto será usado pela IA para personalizar a análise pedagógica
- Seja específico: mencione público-alvo, objetivos gerais, metodologia

#### 3. Salvar Turma

- Clique em **"Criar Turma"**
- Você será redirecionado para a página de detalhes da turma

---

## Definir Objetivos de Aprendizagem

Após criar a turma CUSTOM, você precisa definir os **Objetivos de Aprendizagem**.

### Acessar Gestão de Objetivos

- Na página de detalhes da turma, clique em **"Gerenciar Objetivos"**
- Ou acesse: `Turmas > [Sua Turma] > Objetivos`

### Adicionar Novo Objetivo

Clique em **"Adicionar Objetivo"** e preencha:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Código** | Identificador único (3-20 caracteres) | `PM-MAT-01` |
| **Descrição** | O que o aluno deve aprender (mínimo 20 caracteres) | "Resolver questões de raciocínio lógico aplicando silogismos" |
| **Nível Bloom** | Profundidade cognitiva esperada | APLICAR |
| **Critérios de Evidência** | Como identificar que o objetivo foi atingido | "Uso correto de silogismos (se...então) em exemplos práticos" |

### Níveis de Bloom Disponíveis

Os níveis de Bloom representam a profundidade cognitiva do aprendizado:

1. **LEMBRAR** - Recordar informações (ex: "Listar os estados da região Sul")
2. **ENTENDER** - Compreender conceitos (ex: "Explicar o que é um silogismo")
3. **APLICAR** - Usar conhecimento em situações práticas (ex: "Resolver equações do 1º grau")
4. **ANALISAR** - Decompor informações (ex: "Analisar padrões em sequências lógicas")
5. **AVALIAR** - Julgar/criticar (ex: "Avaliar a validade de um argumento")
6. **CRIAR** - Produzir algo novo (ex: "Elaborar um problema matemático contextualizado")

**Dica:** A maioria dos objetivos em preparatórios fica entre **ENTENDER** e **APLICAR**.

### Exemplo Completo: Preparatório PM

```markdown
**Objetivo 1:**
- Código: PM-MAT-01
- Descrição: Resolver questões de raciocínio lógico aplicando silogismos
- Nível Bloom: APLICAR
- Critérios: Uso correto de silogismos (se...então) em exemplos práticos

**Objetivo 2:**
- Código: PM-LOG-01
- Descrição: Analisar sequências lógicas e padrões numéricos
- Nível Bloom: ANALISAR
- Critérios: Identificação de padrões e cálculo do próximo elemento

**Objetivo 3:**
- Código: PM-MAT-02
- Descrição: Interpretar problemas matemáticos contextualizados
- Nível Bloom: ENTENDER
- Critérios: Identificação de dados e montagem de equações

**Objetivo 4:**
- Código: PM-LOG-02
- Descrição: Aplicar técnicas de eliminação em questões de múltipla escolha
- Nível Bloom: APLICAR
- Critérios: Demonstração de processo de eliminação lógica

**Objetivo 5:**
- Código: PM-POR-01
- Descrição: Compreender gramática contextualizada em provas
- Nível Bloom: ENTENDER
- Critérios: Aplicação de regras gramaticais em contextos de prova
```

---

## Criar Planejamento com Objetivos Customizados

### Passo a Passo

#### 1. Acesse Planejamentos

- No menu lateral, clique em **"Planejamentos"**
- Clique em **"Novo Planejamento"**

#### 2. Passo 1 - Dados Gerais

| Campo | Exemplo |
|-------|---------|
| **Turma** | Preparatório PM - Matemática 2026 |
| **Bimestre** | 1º Bimestre |
| **Título** | Raciocínio Lógico e Matemática Básica |
| **Descrição** | Foco em silogismos, sequências lógicas e problemas contextualizados |

Clique em **"Próximo"**.

#### 3. Passo 2 - Seleção de Objetivos (CUSTOM)

Para turmas **CUSTOM**, o wizard mostra a lista de **Objetivos Customizados** criados para a turma.

- Selecione os objetivos que serão trabalhados neste planejamento (3-10 objetivos recomendado)
- Você pode reordenar por drag-and-drop
- Clique em **"Próximo"**

**Diferença:** Para turmas **BNCC**, você selecionaria **Habilidades BNCC** da base nacional.

#### 4. Passo 3 - Revisão e Confirmação

- Revise os dados gerais e objetivos selecionados
- Clique em **"Salvar Planejamento"**

---

## Análise de Aulas Customizadas

### Upload de Aula

O processo de upload é **idêntico** para BNCC e Custom:

1. Acesse **"Nova Aula"**
2. Selecione a **turma CUSTOM**
3. Selecione o **planejamento** com objetivos customizados
4. Faça upload do áudio **OU** insira transcrição manual
5. Aguarde processamento (STT + Análise Pedagógica)

### Relatório de Análise (Custom)

O relatório para aulas **CUSTOM** inclui:

#### 1. Cobertura de Objetivos de Aprendizagem

- **Header:** "Cobertura de Objetivos de Aprendizagem" (não "Habilidades BNCC")
- **Percentual:** 60% (3 de 5 objetivos atingidos)
- **Badges por Objetivo:**
  - 🟢 **Atingido** - Objetivo trabalhado com profundidade adequada
  - 🟡 **Parcialmente Atingido** - Objetivo abordado, mas sem profundidade cognitiva esperada
  - ⚪ **Não Atingido** - Objetivo não identificado na aula

#### 2. Evidências Literais

Para cada objetivo atingido, o relatório mostra:

- **Citações exatas** da transcrição (entre aspas)
- **Timestamp** aproximado (se disponível)
- **Contexto pedagógico** da evidência

**Exemplo:**
> **PM-MAT-01: Resolver questões de raciocínio lógico aplicando silogismos** ✅ ATINGIDO
>
> **Evidências:**
> - "se todo A é B, e todo B é C, então todo A é C. Vamos resolver alguns exemplos."
> - "Se todo policial é brasileiro, e todo brasileiro é sul-americano, então todo policial é sul-americano."

#### 3. Análise de Níveis de Bloom

**Exclusivo para Cursos CUSTOM**

Para cada objetivo, o relatório compara:

| Objetivo | Planejado | Detectado | Status |
|----------|-----------|-----------|--------|
| PM-MAT-01 | APLICAR | APLICAR | ✅ Alinhado |
| PM-LOG-01 | ANALISAR | ENTENDER | ⚠️ Abaixo do esperado |

**Alerta de Mismatch:**
- 🔺 **Triângulo amarelo** indica que o nível cognitivo detectado está **abaixo** do planejado
- **Sugestão:** Aprofundar a abordagem do objetivo na próxima aula

#### 4. Objetivos Não Cobertos

Lista de objetivos planejados mas **não identificados** na aula:

- PM-LOG-02: Aplicar técnicas de eliminação
- PM-POR-01: Compreender gramática contextualizada

#### 5. Sugestões para Próxima Aula

Baseadas nos objetivos não cobertos, com **contexto** do curso:

> "Reforçar técnicas de eliminação em questões de múltipla escolha (PM-LOG-02)"
> "Incluir simulado de gramática contextualizada (PM-POR-01)"

---

## Boas Práticas

### Definir Objetivos de Qualidade

✅ **DO:**
- Use verbos de ação específicos (resolver, aplicar, analisar)
- Seja específico sobre o contexto (ex: "em provas da PM", "nível A1/A2")
- Defina critérios de evidência observáveis
- Use níveis de Bloom adequados à profundidade esperada

❌ **DON'T:**
- Objetivos genéricos: "Aprender matemática" ❌ → "Resolver equações do 1º grau" ✅
- Descrições < 20 caracteres (muito vagas)
- Critérios de evidência vazios
- Nível de Bloom incompatível com a descrição

### Quantidade de Objetivos

- **Por Turma:** 10-30 objetivos (todo o curso)
- **Por Planejamento (bimestre):** 3-10 objetivos
- **Por Aula (esperado):** 2-5 objetivos

**Dica:** Melhor ter objetivos específicos e mensuráveis do que muitos objetivos genéricos.

### Códigos de Objetivo

Recomendamos padrão: `[CURSO]-[ÁREA]-[NÚMERO]`

**Exemplos:**
- `PM-MAT-01`, `PM-MAT-02` (Preparatório PM - Matemática)
- `ING-CONV-01`, `ING-GRAM-01` (Inglês - Conversação, Gramática)
- `TI-REDE-01`, `TI-SEG-01` (TI - Redes, Segurança)

### Critérios de Evidência

Devem ser **observáveis na transcrição**. Pergunte: "Como eu sei que o aluno aprendeu isso?"

**Bons critérios:**
- "Uso de silogismos em exemplos práticos"
- "Identificação de subject e verb em frases"
- "Montagem de equações a partir de problemas contextualizados"

**Critérios ruins:**
- "Aluno aprendeu" (genérico)
- "Entendimento completo" (subjetivo)
- "" (vazio)

---

## Diferenças entre BNCC e Cursos Custom

| Aspecto | BNCC | Custom |
|---------|------|--------|
| **Unidade de Análise** | Habilidade BNCC (pré-definidas) | Objetivo de Aprendizagem (customizável) |
| **Criação** | Seed do sistema (369 habilidades) | Professor cria manualmente |
| **Código** | EF07MA18, EF89LP04 | PM-MAT-01, ING-CONV-01 |
| **Contexto Pedagógico** | Implícito na BNCC | Explícito (campo obrigatório) |
| **Níveis de Bloom** | ❌ Não exibido | ✅ Exibido e analisado |
| **Badges de Cobertura** | "Completo", "Parcial", "Não Coberto" | "Atingido", "Parcialmente Atingido", "Não Atingido" |
| **Alertas** | Apenas cobertura baixa | Cobertura + Mismatch de Bloom |
| **Critérios de Evidência** | Implícitos na descrição BNCC | Explícitos por objetivo |

---

## FAQ

### 1. Posso misturar BNCC e Custom na mesma turma?

❌ **Não.** Cada turma deve ter `curriculo_tipo = BNCC` **OU** `curriculo_tipo = CUSTOM`.

Para escolas que oferecem ambos, crie **turmas separadas**.

### 2. Posso importar objetivos de outra turma?

⏳ **Não implementado ainda.** Por enquanto, é necessário criar manualmente. Esta feature está no backlog.

### 3. Quantos objetivos posso criar?

📊 **Sem limite técnico.** Recomendado: 10-30 objetivos por curso completo.

### 4. A IA funciona tão bem para Custom quanto para BNCC?

✅ **Sim!** A IA foi treinada para ambos. A qualidade depende de:
- **Descrições claras** dos objetivos
- **Critérios de evidência bem definidos**
- **Contexto pedagógico** detalhado da turma

### 5. Posso editar objetivos depois de criar planejamentos?

⚠️ **Sim, mas com cuidado.** Edições no objetivo afetam **todos os planejamentos** que o utilizam.

**Recomendado:** Edite apenas erros de digitação. Para mudanças estruturais, crie um novo objetivo.

---

## Suporte

**Dúvidas?** Entre em contato:
- 📧 Email: suporte@ressoa.ai
- 📚 Documentação: https://docs.ressoa.ai
- 💬 Slack: #suporte-ressoa (interno escolas parceiras)

---

**Versão:** 1.0.0 (Epic 11)
**Última atualização:** 2026-02-13
