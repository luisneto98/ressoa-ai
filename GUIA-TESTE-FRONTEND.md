# 🎯 Guia Completo: Gerar Relatório pelo Frontend

## ✅ Pré-requisitos

### 1. APIs Configuradas (.env do backend)
```bash
ANTHROPIC_API_KEY=sk-ant-api03-SEU_TOKEN_AQUI
OPENAI_API_KEY=sk-proj-SEU_TOKEN_AQUI  # Opcional se usar transcrição manual
```

### 2. Backend e Frontend Rodando
```bash
# Terminal 1 - Backend
cd ressoa-backend
npm run start:dev

# Terminal 2 - Frontend
cd ressoa-frontend
npm run dev
```

### 3. Acesse o Frontend
Abra: **http://localhost:5176**

---

## 📝 Fluxo Completo pelo Frontend

### Passo 1: Login
1. Acesse http://localhost:5176
2. Faça login com:
   - **Email:** `professor@escolademo.com`
   - **Senha:** `Demo@123`
3. Você será redirecionado para `/minhas-aulas`

---

### Passo 2: Criar Planejamento (OBRIGATÓRIO)

**Por que?** O relatório compara a aula com o planejamento previsto.

#### 2.1 Acessar Planejamentos
1. No menu lateral, clique em **"Planejamentos"** ou acesse:
   ```
   http://localhost:5176/planejamentos
   ```

#### 2.2 Criar Novo Planejamento
1. Clique em **"Novo Planejamento"**
2. **Passo 1 - Dados Gerais:**
   - **Turma:** Selecione uma turma (ex: "6A - Matemática")
   - **Título:** "Frações - Bimestre 1"
   - **Descrição:** (opcional) "Introdução a frações..."
   - Clique em **"Próximo"**

3. **Passo 2 - Seleção de Habilidades:**
   - Navegue pelas habilidades BNCC (276 disponíveis)
   - Filtre por disciplina/ano se necessário
   - **Selecione 2-5 habilidades** relacionadas ao tema
   - Clique em **"Próximo"**

4. **Passo 3 - Revisão:**
   - Revise os dados
   - Clique em **"Salvar Planejamento"**

✅ **Planejamento criado!** Agora você pode criar aulas vinculadas a ele.

---

### Passo 3: Criar Nova Aula

#### 3.1 Acessar Upload de Aula
1. No menu, clique em **"Nova Aula"** ou acesse:
   ```
   http://localhost:5176/aulas/upload
   ```

#### 3.2 Escolher Método de Upload

Você tem **3 opções** (abas na página):

---

#### 🎵 OPÇÃO A: Upload de Áudio (Mais Realista)

**Requisitos:**
- ✅ OPENAI_API_KEY configurado (Whisper)
- ✅ MinIO rodando
- ✅ Arquivo de áudio (.mp3, .wav, .m4a)

**Passos:**
1. Clique na aba **"🎵 Upload de Áudio"**
2. Preencha o formulário:
   - **Turma:** Selecione a turma
   - **Planejamento:** Selecione o planejamento criado
   - **Data:** Escolha a data da aula
   - **Título:** "Introdução a Frações"
   - **Duração:** 50 minutos
3. **Arraste o arquivo de áudio** ou clique para selecionar
4. Upload começa automaticamente (TUS protocol - resumível)
5. Clique em **"Criar Aula"**

**O que acontece:**
- Aula criada com status `CRIADA`
- Job de transcrição entra na fila (Bull)
- Worker processa áudio via Whisper (1-3 min para 50min de áudio)
- Status muda para `TRANSCRITA`
- Você pode acompanhar na lista de aulas

---

#### 📝 OPÇÃO B: Colar Transcrição (Mais Rápido para Testes)

**Vantagens:**
- ❌ NÃO precisa de OPENAI_API_KEY
- ⚡ Instantâneo (pula transcrição)
- 💰 Mais barato (~$0.06 vs $0.17)

**Passos:**
1. Clique na aba **"📝 Colar Transcrição"**
2. Preencha o formulário:
   - **Turma:** Selecione a turma
   - **Planejamento:** Selecione o planejamento
   - **Data:** Escolha a data
   - **Título:** "Introdução a Frações"
3. **Cole a transcrição no campo de texto:**
   ```
   Olá turma! Hoje vamos aprender sobre frações.
   Vamos começar entendendo o que é uma fração...
   [Cole aqui o texto completo da aula transcrita]
   ```
4. Clique em **"Criar Aula"**

**O que acontece:**
- Aula criada com status `TRANSCRITA` (já pronta!)
- Você pode disparar análise imediatamente

---

#### ✍️ OPÇÃO C: Resumo Manual (Menos Detalhado)

**Quando usar:** Quando só tem anotações rápidas da aula.

**Passos:**
1. Clique na aba **"✍️ Resumo Manual"**
2. Preencha o formulário igual opção B
3. Cole suas anotações no campo de texto
4. Clique em **"Criar Aula"**

**Diferença:** Confiança menor (0.5 vs 1.0), relatório pode ser menos preciso.

---

### Passo 4: Disparar Análise Pedagógica

#### 4.1 Acessar Lista de Aulas
1. Vá para **"Minhas Aulas"** ou acesse:
   ```
   http://localhost:5176/minhas-aulas
   ```

#### 4.2 Encontrar Aula Transcrita
- Filtre por status: **"Transcrita"**
- Ou procure a aula que você criou

#### 4.3 Iniciar Análise
1. Clique no **botão "Analisar"** na aula
   - OU clique na aula e depois em "Iniciar Análise"

**O que acontece:**
- Pipeline de 5 prompts executa sequencialmente (~45-60s)
- Status muda para `EM_ANALISE` → `ANALISADA`
- Você pode ver progresso em tempo real (se implementado)

---

### Passo 5: Ver Relatório Gerado

#### 5.1 Acessar Aula Analisada
1. Na lista, clique na aula com status **"Analisada"**
2. Você será redirecionado para:
   ```
   http://localhost:5176/aulas/{aulaId}/analise
   ```

#### 5.2 Navegar pelas Abas do Relatório

A página tem **4 abas principais:**

##### 📊 ABA 1: Relatório
- **Cobertura BNCC:** Quais habilidades foram abordadas
- **Análise Qualitativa:** Metodologia, engajamento, pontos fortes/fracos
- **Resumo:** Resumo executivo da aula
- **Recomendações:** Sugestões pedagógicas

##### ✏️ ABA 2: Exercícios
- **3-5 exercícios gerados automaticamente**
- Alinhados com as habilidades abordadas
- Diferentes níveis de dificuldade
- Gabarito incluído

##### 🚨 ABA 3: Alertas
- **Gaps detectados:** Habilidades previstas não abordadas
- **Desvios:** Conteúdo fora do planejamento
- **Prioridades:** O que precisa ser ajustado

##### 📈 ABA 4: Sugestões (se implementado)
- Próximas aulas recomendadas
- Recursos pedagógicos

---

### Passo 6: Aprovar ou Rejeitar Relatório

#### 6.1 Revisar Relatório
1. Leia todas as abas
2. Verifique se está correto

#### 6.2 Editar (Opcional)
1. Clique em **"Editar"**
2. Faça ajustes no texto (editor rich text)
3. Salve

#### 6.3 Aprovar
1. Clique em **"Aprovar Relatório"**
2. Deixe feedback opcional
3. Confirme

**O que acontece:**
- Status muda para `APROVADA`
- Dados entram para dashboard de cobertura
- Métricas são atualizadas

---

## 🎯 Fluxo Completo Resumido (Caminho Mais Rápido)

```
1. Login (professor@escolademo.com / Demo@123)
   ↓
2. /planejamentos → Novo → Selecionar turma + habilidades → Salvar
   ↓
3. /aulas/upload → Aba "📝 Colar Transcrição" → Colar texto → Criar
   ↓
4. /minhas-aulas → Clicar em "Analisar" na aula
   ↓
5. Aguardar 45-60s (pipeline de 5 prompts)
   ↓
6. /aulas/{id}/analise → Ver relatório completo
   ↓
7. Aprovar → Pronto! ✅
```

---

## 🔧 Troubleshooting

### ❌ "Planejamento não encontrado"
- Crie um planejamento antes de criar aula

### ❌ "Erro ao transcrever"
- Verifique OPENAI_API_KEY no .env
- Use opção "Colar Transcrição" para pular esse passo

### ❌ "Erro ao analisar"
- Verifique ANTHROPIC_API_KEY no .env
- Verifique logs do backend

### ❌ "Turma não aparece"
- Faça login com `professor@escolademo.com` (tem 12 turmas)
- NÃO use `professor@escola.com` (0 turmas)

---

## 💰 Custos por Teste

| Método | Custo | Tempo |
|--------|-------|-------|
| Áudio completo | $0.17 | 2-4 min |
| Transcrição colada | $0.06 | 45-60s |
| Resumo manual | $0.06 | 45-60s |

**Recomendação:** Use "Colar Transcrição" para testes rápidos!
