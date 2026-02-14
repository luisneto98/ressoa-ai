# 📦 ÉPICO 001: Gestão Hierárquica de Cadastros

**Projeto:** Ressoa AI (Professor Analytics)
**Data de Criação:** 2026-02-14
**Versão:** 1.0
**Status:** 📋 Planejado
**Prioridade:** **P0 - BLOQUEADOR CRÍTICO**

---

## 📌 Visão Geral

**ID:** EPIC-001
**Título:** Sistema de Cadastro e Gestão Hierárquica de Usuários (Admin → Diretor → Coordenador → Professor)
**Responsável:** Dev Team
**Estimativa:** 18-24 dias de desenvolvimento

### Problema a Resolver

Atualmente, não existe interface para cadastrar escolas, diretores, coordenadores e professores. Todos os dados são criados via seed manual, **bloqueando o deployment da plataforma em escolas reais**.

### Solução Proposta

Implementar sistema completo de cadastro hierárquico onde:
- **Admin do sistema** cadastra **Escolas** e convida **Diretores** (via email)
- **Diretores** convidam **Coordenadores** e **Professores** (via email)
- **Coordenadores** convidam **Professores** (via email)

Todos os cadastros seguem o padrão de **email de convite** com token único e expiração de 7 dias.

### Valor de Negócio

- ✅ **Desbloqueia deployment** em escolas piloto
- ✅ **Onboarding autônomo** sem dependência de equipe técnica
- ✅ **Segurança aprimorada** (convite via email vs. criação direta)
- ✅ **Escalabilidade** (diretores gerenciam suas próprias escolas)
- ✅ **Auditoria completa** (rastreabilidade de quem convidou quem)

---

## 🏗️ Arquitetura e Decisões Técnicas

### Stack Técnico

**Frontend:**
- React 18 + Vite + TypeScript
- Forms: React Hook Form + zod (validação)
- UI: shadcn/ui (Tailwind CSS)
- State: Zustand (gestão de estado)
- API: React Query + axios

**Backend:**
- NestJS + TypeScript strict
- ORM: Prisma + PostgreSQL 14+
- Auth: JWT (access 15min, refresh 7d) + Passport
- Email: Nodemailer (SMTP) ou SendGrid
- Security: bcrypt (rounds: 12), CORS, @nestjs/throttler

### Novas Entidades de Banco de Dados

#### 1. ConviteUsuario (Nova)

```prisma
model ConviteUsuario {
  id            String        @id @default(uuid())
  email         String
  nome_completo String        @db.VarChar(200)
  tipo_usuario  TipoUsuario   // professor, coordenador, diretor
  escola_id     String
  escola        Escola        @relation(fields: [escola_id], references: [id], onDelete: Cascade)
  criado_por    String
  criador       Usuario       @relation("ConvitesEnviados", fields: [criado_por], references: [id])
  token         String        @unique @default(uuid())
  expira_em     DateTime      // criado_em + 7 dias
  aceito_em     DateTime?
  status        StatusConvite @default(pendente)

  // Campos específicos opcionais (JSON para flexibilidade)
  dados_extras  Json?         // { "area_coordenacao": "pedagogica", "tipo_direcao": "geral", etc }

  criado_em     DateTime      @default(now())
  atualizado_em DateTime      @updatedAt

  @@index([token])
  @@index([email, escola_id])
  @@index([status, expira_em])
}

enum StatusConvite {
  pendente
  aceito
  expirado
  cancelado
}
```

#### 2. Entidades Existentes (Referência)

- ✅ **Escola** (modelo-de-dados-entidades-2026-02-08.md, linhas 69-93)
- ✅ **Usuario** (modelo-de-dados-entidades-2026-02-08.md, linhas 126-162)
  - Com tipo discriminador: `admin`, `diretor`, `coordenador`, `professor`
  - Campos específicos armazenados em JSON ou colunas separadas

---

## 📋 User Stories

### 🔵 US-001: Cadastrar Escola (Admin)

**Como** Admin do sistema Ressoa AI
**Quero** cadastrar uma nova escola cliente
**Para** permitir que diretores e professores dessa escola usem a plataforma

#### Campos do Formulário

| Campo | Tipo | Validação | Obrigatório |
|-------|------|-----------|-------------|
| Nome da escola | String(200) | Min 3 chars | ✅ Sim |
| CNPJ | String(14) | Regex `/^\d{14}$/`, único | ✅ Sim |
| Tipo de escola | Enum | `particular`, `publica_municipal`, `publica_estadual` | ✅ Sim |
| Endereço | JSON | Estruturado (rua, número, bairro, cidade, UF, CEP) | ❌ Não |
| Responsável principal | String(100) | Min 3 chars | ✅ Sim |
| Email de contato | String(100) | Email válido, único | ✅ Sim |
| Telefone | String(20) | Regex `/^\(\d{2}\)\s\d{4,5}-\d{4}$/` | ✅ Sim |
| Plano contratado | Enum | `trial`, `basico`, `completo`, `enterprise` | ✅ Sim |
| Limite horas/mês | Integer | > 0, default por plano | ✅ Sim |

#### Critérios de Aceitação

- [ ] Formulário com validação em tempo real (zod schema)
- [ ] CNPJ único validado no backend (erro 409 se duplicado)
- [ ] Email único validado no backend
- [ ] Escola criada com `status = ativa` e `data_ativacao = NOW()`
- [ ] Após criar, redireciona para tela de convite de Diretor
- [ ] Toast de sucesso: "Escola [Nome] cadastrada com sucesso!"
- [ ] Endpoint: `POST /api/v1/escolas`

#### Validação Técnica (Zod Schema)

```typescript
const escolaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(200),
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ inválido (14 dígitos)"),
  tipo: z.enum(['particular', 'publica_municipal', 'publica_estadual']),
  endereco: z.object({
    rua: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    uf: z.string().length(2).optional(),
    cep: z.string().regex(/^\d{5}-?\d{3}$/).optional(),
  }).optional(),
  contato_principal: z.string().min(3).max(100),
  email: z.string().email("Email inválido"),
  telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone inválido"),
  plano: z.enum(['trial', 'basico', 'completo', 'enterprise']),
  limite_horas_mes: z.number().int().positive(),
});
```

#### Permissão
- Apenas `Usuario.tipo = admin`

---

### 🔵 US-002: Convidar Diretor por Email (Admin)

**Como** Admin do sistema
**Quero** enviar convite por email para um Diretor
**Para** que ele assuma a gestão da escola

#### Campos do Formulário

| Campo | Tipo | Validação | Obrigatório |
|-------|------|-----------|-------------|
| Escola | Dropdown | Select de escolas ativas | ✅ Sim |
| Email do diretor | String(100) | Email válido, único por escola | ✅ Sim |
| Nome completo | String(200) | Min 3 chars | ✅ Sim |
| Tipo de direção | Enum | `geral`, `pedagogica` | ❌ Não |
| Telefone | String(20) | Regex telefone BR | ❌ Não |

#### Critérios de Aceitação

- [ ] Formulário de convite com validação
- [ ] Backend cria registro em `ConviteUsuario`:
  - `tipo_usuario = diretor`
  - `token = uuid()`
  - `expira_em = NOW() + 7 dias`
  - `status = pendente`
- [ ] Email enviado com template HTML responsivo contendo:
  - Link: `https://app.ressoaai.com/aceitar-convite?token={token}`
  - Nome da escola
  - Validade do convite (7 dias)
  - Nome de quem convidou (Admin)
- [ ] Validações de duplicidade:
  - Se email já existe como usuário ativo na escola → erro 409: "Este email já está cadastrado como [tipo]"
  - Se email já tem convite pendente → erro 409: "Já existe um convite pendente para este email"
- [ ] Toast de sucesso: "Convite enviado para [email]"
- [ ] Lista de convites pendentes visível com status e data de expiração
- [ ] Endpoint: `POST /api/v1/convites/enviar`

#### Template de Email (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #0A2647; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0A2647; color: #F8FAFC; padding: 20px; text-align: center; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .button { display: inline-block; background: #2563EB; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ressoa AI</h1>
      <p>Inteligência de Aula, Análise e Previsão de Conteúdo</p>
    </div>
    <div class="content">
      <h2>Olá, {{nome_convidado}}!</h2>
      <p>Você foi convidado(a) por <strong>{{nome_admin}}</strong> para ser <strong>Diretor(a)</strong> na plataforma Ressoa AI da escola:</p>
      <p style="font-size: 18px; font-weight: 600; color: #2563EB;">{{nome_escola}}</p>
      <p>Clique no botão abaixo para aceitar o convite e criar sua senha:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{link_convite}}" class="button">Aceitar Convite</a>
      </p>
      <p style="color: #F97316; font-weight: 600;">⚠️ Este convite expira em 7 dias ({{data_expiracao}}).</p>
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Se você não solicitou este convite, pode ignorar este email.
      </p>
    </div>
    <div class="footer">
      <p>Ressoa AI - Educação com Inteligência</p>
      <p>suporte@ressoaai.com</p>
    </div>
  </div>
</body>
</html>
```

#### Permissão
- Apenas `Usuario.tipo = admin`

---

### 🔵 US-003: Aceitar Convite e Criar Senha (Diretor)

**Como** Diretor convidado
**Quero** aceitar o convite via email e criar minha senha
**Para** acessar a plataforma e gerenciar minha escola

#### Fluxo de Aceitação

1. Diretor clica no link com token no email
2. Sistema valida token (existe, não expirado, status=pendente)
3. Mostra tela de criação de senha
4. Diretor preenche senha forte
5. Sistema cria `Usuario` e marca convite como `aceito`
6. Gera JWT e redireciona para dashboard

#### Campos da Tela

| Campo | Tipo | Validação | Obrigatório |
|-------|------|-----------|-------------|
| Email | String(100) | Readonly, preenchido do convite | - |
| Nome completo | String(200) | Readonly, preenchido do convite | - |
| Senha | String | Min 8 chars, 1 maiúscula, 1 minúscula, 1 número, 1 especial | ✅ Sim |
| Confirmar senha | String | Must match senha | ✅ Sim |

#### Critérios de Aceitação

- [ ] Validação de token no backend:
  - Token não existe → 404 "Convite não encontrado"
  - Token expirado (`expira_em < NOW()`) → 410 "Convite expirado. Solicite um novo convite."
  - Token já aceito (`status = aceito`) → 409 "Convite já aceito anteriormente"
  - Token cancelado → 410 "Este convite foi cancelado"
- [ ] Validação de senha forte (regex + zod)
- [ ] Backend cria `Usuario` com:
  - `tipo = diretor`
  - `senha_hash = bcrypt(senha, 12)` (12 rounds)
  - `status = ativo`
  - `escola_id` do convite
  - Campos específicos de `dados_extras` do convite
- [ ] Atualiza `ConviteUsuario`:
  - `status = aceito`
  - `aceito_em = NOW()`
- [ ] Gera JWT (access 15min, refresh 7d) e salva refresh no Redis
- [ ] Redireciona para `/dashboard/diretor`
- [ ] Toast de sucesso: "Bem-vindo(a) ao Ressoa AI, [Nome]!"
- [ ] Endpoint: `POST /api/v1/convites/aceitar`

#### Validação de Senha (Zod)

```typescript
const senhaSchema = z.string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .regex(/[A-Z]/, "Deve conter ao menos 1 letra maiúscula")
  .regex(/[a-z]/, "Deve conter ao menos 1 letra minúscula")
  .regex(/[0-9]/, "Deve conter ao menos 1 número")
  .regex(/[@$!%*?&#]/, "Deve conter ao menos 1 caractere especial (@$!%*?&#)");

const aceitarConviteSchema = z.object({
  token: z.string().uuid("Token inválido"),
  senha: senhaSchema,
  confirmar_senha: z.string(),
}).refine(data => data.senha === data.confirmar_senha, {
  message: "As senhas não conferem",
  path: ["confirmar_senha"],
});
```

#### Permissão
- Acesso público (validado apenas por token único)

---

### 🔵 US-004: Convidar Coordenador (Diretor)

**Como** Diretor de uma escola
**Quero** enviar convite por email para Coordenador Pedagógico
**Para** que ele ajude na gestão pedagógica da escola

#### Campos do Formulário

| Campo | Tipo | Validação | Obrigatório |
|-------|------|-----------|-------------|
| Email do coordenador | String(100) | Email válido, único por escola | ✅ Sim |
| Nome completo | String(200) | Min 3 chars | ✅ Sim |
| Área de coordenação | Enum | `pedagogica`, `administrativa` | ✅ Sim |
| Telefone | String(20) | Regex telefone BR | ❌ Não |

#### Critérios de Aceitação

- [ ] Formulário de convite (mesmo padrão de US-002)
- [ ] Backend valida permissão:
  - `Usuario.tipo = diretor` AND
  - `Usuario.escola_id = escola_do_coordenador`
  - Se tentar criar para outra escola → 403 Forbidden
- [ ] Backend cria `ConviteUsuario` com:
  - `tipo_usuario = coordenador`
  - `escola_id = Usuario.escola_id` (diretor logado)
  - `criado_por = Usuario.id` (diretor logado)
  - `dados_extras = { "area_coordenacao": "pedagogica" }`
- [ ] Email enviado (template similar a US-002, assinado por Diretor)
- [ ] Diretor vê lista de coordenadores **apenas da sua escola** (tenant isolation via RLS)
- [ ] Toast de sucesso: "Convite enviado para [email]"
- [ ] Endpoint: `POST /api/v1/convites/enviar`

#### Permissão
- `Usuario.tipo = diretor` AND `Usuario.escola_id = {escola}`

---

### 🔵 US-005: Convidar Professor (Diretor)

**Como** Diretor de uma escola
**Quero** enviar convite por email para Professor
**Para** que ele possa usar a plataforma de análise de aulas

#### Campos do Formulário

| Campo | Tipo | Validação | Obrigatório |
|-------|------|-----------|-------------|
| Email do professor | String(100) | Email válido, único por escola | ✅ Sim |
| Nome completo | String(200) | Min 3 chars | ✅ Sim |
| Formação | String(200) | Ex: "Licenciatura em Matemática" | ❌ Não |
| Disciplina principal | Enum | `Matemática`, `Língua Portuguesa`, `Ciências` | ✅ Sim |
| Registro profissional | String(50) | Ex: "RP 12345-SP" | ❌ Não |
| Telefone | String(20) | Regex telefone BR | ❌ Não |

#### Critérios de Aceitação

- [ ] Formulário de convite
- [ ] Backend valida permissão (diretor da mesma escola)
- [ ] Backend cria `ConviteUsuario` com:
  - `tipo_usuario = professor`
  - `dados_extras = { "formacao": "...", "disciplina_principal": "...", "registro_profissional": "..." }`
- [ ] Email enviado
- [ ] Diretor vê lista de professores **apenas da sua escola**
- [ ] Toast de sucesso: "Convite enviado para [email]"
- [ ] Endpoint: `POST /api/v1/convites/enviar`

#### Permissão
- `Usuario.tipo = diretor` AND `Usuario.escola_id = {escola}`

---

### 🔵 US-006: Convidar Professor (Coordenador)

**Como** Coordenador Pedagógico
**Quero** enviar convite por email para Professor
**Para** aumentar o time de professores da escola

#### Critérios de Aceitação

- [ ] Mesmo formulário de US-005
- [ ] Backend valida permissão:
  - `Usuario.tipo = coordenador` AND
  - `Usuario.escola_id = {escola}`
- [ ] Email enviado
- [ ] Coordenador vê lista de professores **apenas da sua escola**
- [ ] Endpoint: `POST /api/v1/convites/enviar`

#### Permissão
- `Usuario.tipo = coordenador` AND `Usuario.escola_id = {escola}`

---

### 🔵 US-007: Listar Usuários Cadastrados

**Como** Admin/Diretor/Coordenador
**Quero** ver lista de todos os usuários cadastrados
**Para** gerenciar e acompanhar o time da escola

#### Funcionalidades da Tela

**Tabela com colunas:**
- Avatar/Foto
- Nome completo
- Email
- Tipo (badge colorido: Admin/Diretor/Coordenador/Professor)
- Status (badge: Ativo/Inativo/Bloqueado)
- Data de cadastro
- Ações (Editar, Desativar/Reativar, Ver detalhes)

**Filtros:**
- Busca por nome ou email (debounce 300ms)
- Filtro por tipo (dropdown multi-select)
- Filtro por status (dropdown multi-select)

**Paginação:**
- 20 usuários por página
- Navegação: Anterior, 1, 2, 3, ..., Próximo
- Total de usuários visível

**Ordenação:**
- Nome (A-Z, Z-A)
- Data de cadastro (Mais recente, Mais antigo)

#### Critérios de Aceitação

- [ ] **Admin** vê todos usuários de todas escolas
- [ ] **Diretor/Coordenador** vê apenas usuários da **sua escola** (RLS: `escola_id = Usuario.escola_id`)
- [ ] Busca funciona em tempo real com debounce 300ms
- [ ] Badges visuais para status:
  - 🟢 Verde "Ativo"
  - ⚪ Cinza "Inativo"
  - 🔴 Vermelho "Bloqueado"
- [ ] Badges para tipo:
  - 🔵 Azul "Admin"
  - 🟣 Roxo "Diretor"
  - 🟡 Amarelo "Coordenador"
  - 🟢 Verde "Professor"
- [ ] Skeleton loading enquanto carrega
- [ ] Empty state se não houver usuários
- [ ] Endpoint: `GET /api/v1/usuarios?page=1&limit=20&search=...&tipo=...&status=...`

#### Permissão
- Admin: sem restrição
- Diretor/Coordenador: RLS `escola_id = Usuario.escola_id`

---

### 🔵 US-008: Editar Dados de Usuário

**Como** Admin/Diretor/Coordenador
**Quero** editar dados de um usuário
**Para** manter informações atualizadas

#### Campos Editáveis

**Todos os tipos:**
- Nome completo
- Telefone
- Foto de perfil (upload, max 2MB, formatos: jpg, png, webp)

**Específico de Professor:**
- Formação
- Disciplina principal
- Registro profissional

**Específico de Coordenador:**
- Área de coordenação

**Específico de Diretor:**
- Tipo de direção

#### Campos NÃO Editáveis

- ❌ Email (identificador único)
- ❌ Tipo de usuário (professor/coordenador/diretor)
- ❌ Escola (não pode transferir entre escolas)
- ❌ Senha (tem fluxo separado de "Redefinir senha")

#### Critérios de Aceitação

- [ ] Modal ou página de edição com formulário preenchido
- [ ] Validação com zod schema
- [ ] Upload de foto com preview antes de salvar
- [ ] **Admin** pode editar qualquer usuário
- [ ] **Diretor/Coordenador** pode editar apenas usuários da **sua escola**
- [ ] Backend valida permissões (403 se tentar editar usuário de outra escola)
- [ ] Toast de sucesso: "Dados de [Nome] atualizados com sucesso!"
- [ ] Endpoint: `PATCH /api/v1/usuarios/:id`

#### Permissão
- Admin: sem restrição
- Diretor/Coordenador: RLS `escola_id = Usuario.escola_id`

---

### 🔵 US-009: Desativar Usuário (Soft Delete)

**Como** Admin/Diretor/Coordenador
**Quero** desativar um usuário
**Para** impedir seu acesso sem perder histórico

#### Fluxo

1. Clica em "Desativar" na lista ou página de usuário
2. Modal de confirmação:
   - "Tem certeza que deseja desativar **[Nome]**?"
   - "O usuário não poderá mais fazer login, mas todos os dados serão preservados."
3. Botões: "Cancelar" (cinza) e "Desativar" (vermelho)
4. Backend atualiza `Usuario.status = inativo`

#### Critérios de Aceitação

- [ ] Modal de confirmação com descrição clara
- [ ] Backend atualiza `Usuario.status = inativo` (não deleta)
- [ ] Usuário desativado não consegue fazer login (validado no Passport JWT strategy)
- [ ] Dados históricos preservados (aulas, relatórios continuam vinculados)
- [ ] **Diretor/Coordenador** pode desativar apenas usuários da **sua escola**
- [ ] Toast de sucesso: "[Nome] foi desativado(a)"
- [ ] Badge na lista muda para ⚪ "Inativo"
- [ ] Endpoint: `PATCH /api/v1/usuarios/:id/desativar`

#### Regras de Negócio

- ❌ Não pode desativar a si mesmo
- ❌ Não pode desativar usuário de outra escola (RLS)
- ✅ Admin pode desativar qualquer usuário

#### Permissão
- Admin: sem restrição
- Diretor/Coordenador: RLS `escola_id = Usuario.escola_id`

---

### 🔵 US-010: Reativar Usuário

**Como** Admin/Diretor/Coordenador
**Quero** reativar um usuário desativado
**Para** restaurar seu acesso ao sistema

#### Fluxo

1. Usuários inativos aparecem com badge ⚪ "Inativo"
2. Botão "Reativar" visível apenas para inativos
3. Clica → Backend atualiza `Usuario.status = ativo`
4. Toast de sucesso

#### Critérios de Aceitação

- [ ] Botão "Reativar" visível apenas para usuários com `status = inativo`
- [ ] Backend atualiza `Usuario.status = ativo`
- [ ] Usuário consegue fazer login novamente
- [ ] Toast de sucesso: "[Nome] foi reativado(a)"
- [ ] Badge na lista muda para 🟢 "Ativo"
- [ ] Endpoint: `PATCH /api/v1/usuarios/:id/reativar`

#### Permissão
- Admin: sem restrição
- Diretor/Coordenador: RLS `escola_id = Usuario.escola_id`

---

### 🔵 US-011: Cancelar Convite Pendente

**Como** Admin/Diretor/Coordenador
**Quero** cancelar um convite pendente
**Para** corrigir erros (email errado, pessoa errada)

#### Fluxo

1. Tela separada: "Convites Pendentes"
2. Tabela com:
   - Email convidado
   - Tipo (Diretor/Coordenador/Professor)
   - Data de envio
   - Expira em (countdown visual, ex: "5 dias restantes")
   - Status (badge)
   - Ações: "Cancelar" | "Reenviar"
3. Clica "Cancelar" → Modal de confirmação → Backend atualiza `status = cancelado`

#### Critérios de Aceitação

- [ ] Tela de "Convites Pendentes" acessível via menu
- [ ] Filtros por status: Pendente, Expirado, Cancelado, Aceito
- [ ] Countdown visual para expiração (ex: "⏰ Expira em 3 dias")
- [ ] Backend atualiza `ConviteUsuario.status = cancelado`
- [ ] Link do email antigo não funciona mais (validação: `status = pendente`)
- [ ] Toast de sucesso: "Convite para [email] foi cancelado"
- [ ] **Diretor/Coordenador** vê apenas convites da **sua escola**
- [ ] Endpoint: `PATCH /api/v1/convites/:id/cancelar`

#### Permissão
- Admin: sem restrição
- Diretor/Coordenador: RLS `escola_id = ConviteUsuario.escola_id`

---

### 🔵 US-012: Reenviar Convite Expirado

**Como** Admin/Diretor/Coordenador
**Quero** reenviar um convite expirado
**Para** dar nova chance ao usuário de aceitar

#### Fluxo

1. Convites expirados aparecem com badge 🔴 "Expirado"
2. Botão "Reenviar" visível
3. Clica → Backend:
   - Cancela convite antigo (`status = cancelado`)
   - Cria novo `ConviteUsuario` com novo `token` e `expira_em`
4. Envia novo email com novo link
5. Toast de sucesso

#### Critérios de Aceitação

- [ ] Botão "Reenviar" visível apenas para convites com:
  - `status = expirado` OU
  - `status = pendente` AND `expira_em < NOW()`
- [ ] Backend:
  - Atualiza convite antigo: `status = cancelado`
  - Cria novo registro `ConviteUsuario` com:
    - Novo `token = uuid()`
    - Nova `expira_em = NOW() + 7 dias`
    - `status = pendente`
    - Mesmo email, nome, tipo, escola
- [ ] Novo email enviado com novo link
- [ ] Toast de sucesso: "Convite reenviado para [email]"
- [ ] Endpoint: `POST /api/v1/convites/:id/reenviar`

#### Regra de Negócio

- ❌ Não pode reenviar convite já aceito (`status = aceito`)
- ✅ Pode reenviar convite cancelado (se necessário)

#### Permissão
- Admin: sem restrição
- Diretor/Coordenador: RLS `escola_id = ConviteUsuario.escola_id`

---

## 🎨 Considerações de UX (Design System)

### Componentes shadcn/ui Utilizados

| Componente | Uso |
|------------|-----|
| `<Form>` + React Hook Form | Todos os formulários |
| `<Input>`, `<Select>`, `<Textarea>` | Campos de formulário |
| `<DataTable>` | Tabelas de usuários e convites |
| `<Dialog>` | Modais de confirmação (desativar, cancelar) |
| `<Toaster>` | Feedback de sucesso/erro |
| `<Badge>` | Status (Ativo/Inativo/Bloqueado), Tipo de usuário |
| `<Button>` | Ações primárias e secundárias |
| `<Avatar>` | Foto de perfil |
| `<Skeleton>` | Loading states |

### Paleta de Cores (Ressoa AI)

| Uso | Cor | Hex Code |
|-----|-----|----------|
| Backgrounds primários | Deep Navy | `#0A2647` |
| Botões primários ("Enviar Convite", "Cadastrar") | Tech Blue | `#2563EB` |
| Botões destrutivos ("Desativar", "Cancelar") | Focus Orange | `#F97316` |
| Backgrounds de formulário | Ghost White | `#F8FAFC` |
| IA/Tecnologia | Cyan AI | `#06B6D4` |

### Tipografia

- **Headers:** Montserrat (600, 700)
- **Body:** Inter (400, 500, 600)

### Acessibilidade (WCAG AAA)

- ✅ Contraste 14.8:1 (Deep Navy vs Ghost White)
- ✅ Labels em todos inputs (`htmlFor` + `id`)
- ✅ Aria-labels em botões de ação
- ✅ Touch targets mínimo 44px
- ✅ Navegação por teclado (Tab, Enter, Esc)
- ✅ Focus visible em todos elementos interativos

---

## 🔐 Considerações de Segurança

### Autenticação & Autorização

| Mecanismo | Implementação |
|-----------|---------------|
| **Hash de senha** | bcrypt com 12 rounds |
| **JWT Access Token** | 15 minutos, assinado com secret `.env` |
| **JWT Refresh Token** | 7 dias, armazenado no Redis |
| **Passport Strategies** | JWT (autenticado), Local (login) |
| **CORS** | Restrito a domínios `.env` (`CORS_ORIGIN`) |

### Rate Limiting (NestJS @nestjs/throttler)

| Endpoint | Limite | Motivo |
|----------|--------|--------|
| `POST /api/v1/convites/enviar` | 5 req/min | Evitar spam de emails |
| `POST /api/v1/convites/aceitar` | 10 req/min | Evitar brute force de tokens |
| `POST /api/v1/auth/login` | 5 req/min | Evitar brute force de senhas |
| `GET /api/v1/usuarios` | 60 req/min | Uso normal |

### Validação Multi-Camada

1. **Frontend:** React Hook Form + zod (UX imediata, feedback visual)
2. **Backend:** class-validator DTOs (segurança, não confia no frontend)
3. **Database:** Constraints (CNPJ unique, email unique per escola, foreign keys)

### Row-Level Security (RLS)

**Implementação via Prisma Middleware:**

```typescript
// prisma/middleware/rls.middleware.ts
export function rlsMiddleware(usuario: Usuario) {
  return async (params: any, next: any) => {
    // Diretor/Coordenador só veem dados da sua escola
    if (usuario.tipo === 'diretor' || usuario.tipo === 'coordenador') {
      if (params.model === 'Usuario' || params.model === 'ConviteUsuario') {
        params.args.where = {
          ...params.args.where,
          escola_id: usuario.escola_id,
        };
      }
    }
    return next(params);
  };
}
```

---

## ✅ Definition of Done (DoD)

### Código

- [ ] Todos os endpoints REST implementados e documentados (Swagger)
  - `POST /api/v1/escolas`
  - `GET /api/v1/escolas`
  - `PATCH /api/v1/escolas/:id`
  - `POST /api/v1/convites/enviar`
  - `POST /api/v1/convites/aceitar`
  - `PATCH /api/v1/convites/:id/cancelar`
  - `POST /api/v1/convites/:id/reenviar`
  - `GET /api/v1/convites` (lista de pendentes)
  - `GET /api/v1/usuarios`
  - `PATCH /api/v1/usuarios/:id`
  - `PATCH /api/v1/usuarios/:id/desativar`
  - `PATCH /api/v1/usuarios/:id/reativar`
- [ ] DTOs validados com class-validator em todos endpoints
- [ ] Prisma schema atualizado (migrations criadas e versionadas)
- [ ] Frontend: 6+ formulários com validação (React Hook Form + zod)
- [ ] Frontend: 3 tabelas com paginação, busca e filtros
- [ ] Integração com serviço de email (Nodemailer ou SendGrid)
- [ ] Upload de foto de perfil (S3 ou MinIO)

### Testes

- [ ] **Backend - Testes Unitários (Jest):**
  - Services: `EscolaService`, `UsuarioService`, `ConviteService`, `EmailService`
  - Coverage: > 80%
- [ ] **Backend - Testes e2e (Supertest):**
  - Fluxo completo: Criar escola → Convidar diretor → Aceitar convite → Login
  - Validação de permissões (RLS)
  - Validação de expiração de token
- [ ] **Frontend - Testes de Componentes (React Testing Library):**
  - Formulário de cadastro de escola
  - Formulário de convite
  - Tela de aceitação de convite
  - Tabela de usuários (paginação, filtros)

### Segurança

- [ ] Rate limiting configurado e testado
- [ ] CORS configurado (`.env.CORS_ORIGIN`)
- [ ] JWT com expiração correta (access 15min, refresh 7d)
- [ ] RLS validado (Diretor não vê dados de outra escola)
- [ ] Validação de token de convite (expiração, status, unicidade)
- [ ] Senhas hasheadas com bcrypt (12 rounds)
- [ ] Variáveis sensíveis em `.env` (não commitadas)

### Documentação

- [ ] Swagger/OpenAPI docs gerados automaticamente
- [ ] README atualizado com:
  - Configuração de email (SMTP ou SendGrid)
  - Variáveis de ambiente necessárias
  - Como criar admin inicial (seed)
- [ ] `.env.example` atualizado com todas variáveis necessárias
- [ ] Comentários em código complexo (RLS, validação de token)

### Deployment

- [ ] Migrations aplicadas em staging
- [ ] Seed de admin inicial criado (`npm run seed:admin`)
- [ ] Variáveis de ambiente configuradas (Railway/Render)
- [ ] Smoke test em staging:
  1. Criar escola
  2. Convidar diretor
  3. Aceitar convite (email funciona)
  4. Login como diretor
  5. Convidar professor
  6. Aceitar convite
  7. Login como professor
- [ ] SSL configurado (HTTPS obrigatório para produção)

---

## 📊 Métricas de Sucesso

### KPIs do Épico

| Métrica | Target | Como Medir |
|---------|--------|------------|
| **Taxa de aceitação de convites** | > 80% em 7 dias | `COUNT(status=aceito) / COUNT(status=pendente) * 100` |
| **Tempo médio de aceitação** | < 24h | `AVG(aceito_em - criado_em)` para convites aceitos |
| **Taxa de reenvio** | < 15% | `COUNT(reenviados) / COUNT(total convites) * 100` |
| **Erros de validação** | < 5% de submissões | Logs de erros 400/409 no backend |
| **Convites expirados (não aceitos)** | < 20% | `COUNT(status=expirado) / COUNT(total convites) * 100` |

### Monitoramento Operacional

- [ ] Sentry configurado para capturar erros (frontend + backend)
- [ ] Logs estruturados (Pino) para rastreabilidade
- [ ] Métricas de email (taxa de entrega, bounce rate) - se SendGrid

---

## 🚀 Plano de Implementação

### Fase 1: Backend Core (3-4 dias)

**Responsável:** Backend Dev
**Entregáveis:**
- [ ] Prisma schema completo (`Escola`, `Usuario`, `ConviteUsuario`)
- [ ] Migrations criadas e testadas localmente
- [ ] Seed de admin inicial (`npm run seed:admin`)
- [ ] Services básicos: `EscolaService`, `UsuarioService`
- [ ] Endpoints CRUD de Escola (`POST`, `GET`, `PATCH`)

### Fase 2: Sistema de Convites (4-5 dias)

**Responsável:** Backend Dev
**Entregáveis:**
- [ ] `ConviteService` com geração de token (uuid)
- [ ] Validação de expiração e status
- [ ] Integração com Nodemailer (ou SendGrid)
- [ ] Template de email HTML responsivo
- [ ] Endpoints:
  - `POST /api/v1/convites/enviar`
  - `GET /api/v1/convites/validar/:token`
  - `POST /api/v1/convites/aceitar`
  - `PATCH /api/v1/convites/:id/cancelar`
  - `POST /api/v1/convites/:id/reenviar`

### Fase 3: Frontend - Formulários (4-5 dias)

**Responsável:** Frontend Dev
**Entregáveis:**
- [ ] Formulário de cadastro de Escola (Admin)
- [ ] Formulário de convite (3 variações: Diretor, Coordenador, Professor)
- [ ] Tela de aceitação de convite (rota pública `/aceitar-convite?token=...`)
- [ ] Validações com zod schemas
- [ ] Integração com API (React Query + axios)

### Fase 4: Frontend - Listagens e Gestão (3-4 dias)

**Responsável:** Frontend Dev
**Entregáveis:**
- [ ] Tabela de Escolas (Admin only) - shadcn/ui DataTable
- [ ] Tabela de Usuários (Admin/Diretor/Coordenador) com RLS
- [ ] Tabela de Convites Pendentes
- [ ] Filtros, busca e paginação
- [ ] Ações: Editar, Desativar, Reativar, Cancelar, Reenviar
- [ ] Upload de foto de perfil

### Fase 5: Segurança e Permissões (2-3 dias)

**Responsável:** Backend Dev
**Entregáveis:**
- [ ] RLS implementation (Prisma middleware)
- [ ] Rate limiting (@nestjs/throttler)
- [ ] Testes de permissões (e2e)
- [ ] Validação de JWT em todos endpoints protegidos
- [ ] CORS configurado

### Fase 6: Testes e Refinamento (2-3 dias)

**Responsável:** QA / Dev Team
**Entregáveis:**
- [ ] Testes unitários (backend services) - 80%+ coverage
- [ ] Testes e2e (fluxo completo de onboarding)
- [ ] Testes de componentes (frontend)
- [ ] Smoke test em staging
- [ ] Correção de bugs encontrados

---

## 🔗 Dependências e Riscos

### Dependências Externas

| Dependência | Status | Bloqueador? |
|-------------|--------|-------------|
| PRD completo | ✅ Completo | Não |
| Architecture doc | ✅ Completo | Não |
| UX Design doc | ✅ Completo | Não |
| Modelo de Dados | ✅ Completo | Não |
| Serviço de email (SMTP/SendGrid) | ⚠️ A configurar | **Sim** |
| Domínio configurado (`noreply@ressoaai.com`) | ⚠️ A configurar | **Sim** |
| SSL/HTTPS em produção | ⚠️ A configurar | Sim (para emails) |

### Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Emails vão para spam** | 🟡 Alta | 🔴 Alto | Configurar SPF, DKIM, DMARC no domínio. Usar SendGrid (reputação alta). |
| **Convites expirando muito rápido (7 dias)** | 🟢 Baixa | 🟡 Médio | Permitir extensão manual do prazo (14 dias) via admin. Implementar notificação 1 dia antes de expirar. |
| **RLS não funciona corretamente (vazamento de dados)** | 🟡 Média | 🔴 Alto | Testes extensivos de permissões (e2e). Code review obrigatório. Prisma middleware validado. |
| **Onboarding complexo para diretores não-técnicos** | 🟡 Média | 🟡 Médio | UX simplificada, tooltip/tour guiado na primeira vez. Vídeo tutorial. |
| **Rate limiting muito restritivo** | 🟢 Baixa | 🟢 Baixo | Monitorar logs e ajustar limites conforme uso real. |

---

## 📝 Notas Adicionais

### Melhorias Futuras (Pós-MVP)

- [ ] **Importação de usuários em massa:** Upload CSV com validação
- [ ] **Integração SSO:** Google Workspace, Microsoft 365
- [ ] **Convite por WhatsApp:** Além de email (via Twilio API)
- [ ] **2FA para Admin:** Autenticação em dois fatores obrigatória
- [ ] **Logs de auditoria:** Tabela separada rastreando quem convidou quem e quando
- [ ] **Notificação de expiração:** Email automático 1 dia antes do convite expirar
- [ ] **Customização de mensagem de convite:** Permitir que Diretor personalize texto
- [ ] **Assinatura digital de emails:** DKIM para maior deliverability

### Alternativas Consideradas e Rejeitadas

| Alternativa | Motivo da Rejeição |
|-------------|-------------------|
| Criação direta com senha (sem convite) | ❌ Pior UX, menos seguro, Admin teria que criar senhas |
| Convite sem expiração | ❌ Risco de segurança (link permanente) |
| Professor pode convidar outros professores | ❌ Foge da hierarquia definida, possível abuso |
| Usar Clerk ou Auth0 para gestão de usuários | ❌ Vendor lock-in, custo adicional, menos controle |
| Armazenar senha em plain text | ❌ NUNCA. Sempre bcrypt. |

---

## 📚 Referências

### Documentos do Projeto

- [PRD - Ressoa AI](/_bmad-output/planning-artifacts/prd.md)
- [Architecture Document](/_bmad-output/planning-artifacts/architecture.md)
- [UX Design Specification](/_bmad-output/planning-artifacts/ux-design-specification.md)
- [Modelo de Dados e Entidades](/_bmad-output/planning-artifacts/modelo-de-dados-entidades-2026-02-08.md)

### Tecnologias e Bibliotecas

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma ORM](https://www.prisma.io/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Schema Validation](https://zod.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Nodemailer](https://nodemailer.com/) ou [SendGrid](https://sendgrid.com/docs/)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js)

### Segurança

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Email Deliverability Best Practices](https://sendgrid.com/blog/email-deliverability-best-practices/)

---

**Épico criado em:** 2026-02-14
**Versão:** 1.0
**Status:** 📋 Pronto para Desenvolvimento
**Próximo passo:** Quebrar em tasks/subtasks e iniciar Fase 1 (Backend Core)

---

## ✅ Checklist de Pronto para Iniciar

- [x] Modelo de dados validado
- [x] Arquitetura técnica definida
- [x] UX/UI patterns definidos
- [x] User Stories completas com critérios de aceitação
- [x] Definition of Done acordado
- [x] Plano de implementação sequenciado
- [x] Riscos identificados e mitigações definidas
- [ ] Serviço de email configurado (BLOQUEADOR)
- [ ] Domínio e DNS configurados (BLOQUEADOR)
- [ ] Dev team alocado
- [ ] Ambiente de staging pronto

**Status Geral:** ⚠️ **BLOQUEADO** até configurar serviço de email e domínio.

---

**FIM DO ÉPICO 001**
