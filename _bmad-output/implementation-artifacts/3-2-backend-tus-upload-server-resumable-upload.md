# Story 3.2: Backend - TUS Upload Server (Resumable Upload)

Status: ready-for-dev

---

## Story

As a **desenvolvedor**,
I want **servidor TUS configurado para uploads resumíveis de arquivos grandes**,
So that **professores podem fazer upload de áudios de 50min (~25-50MB) mesmo com conexões instáveis**.

---

## Acceptance Criteria

### DEPENDENCIES INSTALLATION

**Given** o projeto backend precisa do TUS protocol
**When** instalo as dependências:
```bash
npm install @tus/server@2.3.0 @tus/s3-store@2.0.1 @aws-sdk/client-s3
```
**Then** as dependências TUS estão instaladas e prontas para uso

---

### TUS MODULE STRUCTURE

**Given** as dependências estão instaladas
**When** crio `TusModule` em `src/modules/tus/`:
- `tus.controller.ts`: expõe endpoints TUS (POST, PATCH, HEAD, DELETE)
- `tus.service.ts`: configuração do servidor TUS
- `tus.module.ts`: registra providers
**Then** o módulo TUS está estruturado seguindo padrão NestJS

---

### TUS SERVICE CONFIGURATION

**Given** o módulo está criado
**When** configuro `TusService` com storage S3/MinIO:

```typescript
import { Server } from '@tus/server';
import { S3Store } from '@tus/s3-store';
import { S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class TusService {
  private server: Server;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const s3Client = new S3Client({
      region: this.configService.get('S3_REGION') || 'us-east-1',
      endpoint: this.configService.get('S3_ENDPOINT'), // MinIO local ou AWS
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY'),
        secretAccessKey: this.configService.get('S3_SECRET_KEY'),
      },
      forcePathStyle: true, // Required for MinIO
    });

    const store = new S3Store({
      s3Client,
      bucket: this.configService.get('S3_BUCKET') || 'ressoa-uploads',
      partSize: 8 * 1024 * 1024, // 8MB chunks (optimal for S3 multipart)
    });

    this.server = new Server({
      path: '/api/v1/uploads',
      datastore: store,
      maxSize: 2 * 1024 * 1024 * 1024, // 2GB max
      namingFunction: (req) => {
        // Gerar nome único: {escola_id}/{professor_id}/{uuid}.{ext}
        const metadata = req.upload?.metadata || {};
        const escolaId = metadata.escola_id || 'unknown';
        const professorId = metadata.professor_id || 'unknown';
        const uuid = crypto.randomUUID();
        const ext = metadata.filetype?.split('/')[1] || 'bin';
        return `${escolaId}/${professorId}/${uuid}.${ext}`;
      },
      onUploadCreate: async (req, res, upload) => {
        // Validar metadata obrigatória
        const { escola_id, professor_id, turma_id, data, aula_id } = upload.metadata || {};

        if (!escola_id || !professor_id || !turma_id || !data || !aula_id) {
          throw new Error('Metadata obrigatória faltando: escola_id, professor_id, turma_id, data, aula_id');
        }

        // Validar formato de áudio
        const { filetype } = upload.metadata || {};
        const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/webm'];

        if (!filetype || !allowedTypes.includes(filetype)) {
          throw new Error(`Formato não suportado. Use: mp3, wav, m4a, webm`);
        }

        // Validação: arquivo não vazio
        if (upload.size === 0) {
          throw new Error('Arquivo vazio');
        }

        // Validação: tamanho máximo 2GB
        if (upload.size > 2 * 1024 * 1024 * 1024) {
          throw new Error('Arquivo maior que 2GB');
        }

        // Atualizar status da aula: CRIADA → UPLOAD_PROGRESSO
        await this.prisma.aula.update({
          where: {
            id: aula_id,
            escola_id: escola_id, // Multi-tenancy
          },
          data: { status_processamento: 'UPLOAD_PROGRESSO' }
        });
      },
      onUploadFinish: async (req, res, upload) => {
        // Upload completo - atualizar aula
        const { aula_id, escola_id } = upload.metadata || {};
        const bucket = this.configService.get('S3_BUCKET') || 'ressoa-uploads';
        const fileUrl = `s3://${bucket}/${upload.id}`;

        await this.prisma.aula.update({
          where: {
            id: aula_id,
            escola_id: escola_id, // Multi-tenancy
          },
          data: {
            status_processamento: 'AGUARDANDO_TRANSCRICAO',
            arquivo_url: fileUrl,
            arquivo_tamanho: upload.size,
          }
        });

        // Enfileirar job de transcrição (Epic 4)
        // await this.bullQueue.add('transcribe-aula', { aulaId: aula_id });
        // NOTE: Bull queue será implementado em Epic 4, comentar por enquanto
      },
    });
  }

  getServer(): Server {
    return this.server;
  }
}
```

**Then** o TUS server está configurado com S3/MinIO e validações de segurança

---

### TUS CONTROLLER

**Given** o service está configurado
**When** crio `TusController` que expõe TUS endpoints:

```typescript
@Controller('api/v1/uploads')
export class TusController {
  constructor(private tusService: TusService) {}

  @All('*')
  @UseGuards(JwtAuthGuard) // ✅ Autenticação obrigatória
  async handleTus(@Req() req, @Res() res) {
    const server = this.tusService.getServer();
    return server.handle(req, res);
  }
}
```

**Then** os endpoints TUS estão expostos em `/api/v1/uploads` com autenticação JWT

---

### JWT AUTHENTICATION MIDDLEWARE

**Given** o controller está criado
**When** adiciono middleware de autenticação no TUS server:

```typescript
this.server = new Server({
  // ... config anterior
  onIncomingRequest: async (req, res) => {
    // JWT já validado por JwtAuthGuard do NestJS
    // Injetar dados do usuário na request se necessário
    if (!req.user) {
      throw new Error('Unauthorized: JWT inválido ou ausente');
    }

    // Validar que professor está tentando fazer upload de aula própria
    const { professor_id, escola_id } = req.upload?.metadata || {};

    if (professor_id !== req.user.userId) {
      throw new Error('Forbidden: Upload só permitido para aulas próprias');
    }

    if (escola_id !== req.user.escolaId) {
      throw new Error('Forbidden: Escola não corresponde ao usuário');
    }
  },
});
```

**Then** TUS endpoints exigem autenticação JWT e validam ownership

---

### CLEANUP DE UPLOADS ABANDONADOS

**Given** o TUS server está completo
**When** implemento cleanup de uploads abandonados:

- Bull scheduled job (Epic 4): roda diariamente às 3h AM
- Query: uploads com `upload_expires < NOW()` (TUS metadata)
- Deleta arquivos do S3: `s3.deleteObject()`
- Deleta metadata do TUS store
- Atualiza aulas órfãs: `status_processamento = 'ERRO'`

**Then** uploads abandonados são limpos automaticamente

**NOTE:** Implementação completa de cleanup será feita em Epic 4 (quando Bull queue estiver disponível). Por enquanto, documentar apenas.

---

### UPLOAD RESUMÍVEL END-TO-END

**Given** tudo está implementado
**When** testo upload resumível com Postman ou curl:

1. **Cliente inicia upload**: `POST /api/v1/uploads`
   - Headers:
     - `Authorization: Bearer {jwt_token}`
     - `Upload-Length: 26214400` (25MB em bytes)
     - `Upload-Metadata: filename bXVzaWNhLW1wMy50eHQ=,filetype YXVkaW8vbXBlZw==,aula_id dXVpZC0xMjM=,escola_id dXVpZC1lc2NvbGE=,professor_id dXVpZC1wcm9m,turma_id dXVpZC10dXJtYQ==,data MjAyNi0wMi0xMQ==`
     - `Tus-Resumable: 1.0.0`
   - Response: `201 Created`
     - Header `Location: /api/v1/uploads/{upload-id}`

2. **Aula atualizada**: status → UPLOAD_PROGRESSO

3. **Cliente envia chunks**: `PATCH /api/v1/uploads/{upload-id}`
   - Headers:
     - `Authorization: Bearer {jwt_token}`
     - `Upload-Offset: 0` (primeira chunk)
     - `Content-Type: application/offset+octet-stream`
     - `Tus-Resumable: 1.0.0`
   - Body: Primeiros 8MB de dados binários
   - Response: `204 No Content`
     - Header `Upload-Offset: 8388608` (8MB em bytes)

4. **Progresso**: 20%, 40%, 60%... (TUS `Upload-Offset` header)

5. **Simulo queda de conexão após 60%**

6. **Cliente reconecta**: `HEAD /api/v1/uploads/{upload-id}`
   - Headers:
     - `Authorization: Bearer {jwt_token}`
     - `Tus-Resumable: 1.0.0`
   - Response: `200 OK`
     - Header `Upload-Offset: 15728640` (15MB = 60% de 25MB)

7. **Cliente resume**: `PATCH` a partir de 60%
   - Header `Upload-Offset: 15728640`
   - Body: Próximos 8MB

8. **Upload completa**: 100%

9. **TUS chama `onUploadFinish`**

10. **Aula atualizada**:
    - `status_processamento` → AGUARDANDO_TRANSCRICAO
    - `arquivo_url` → s3://ressoa-uploads/{escola_id}/{professor_id}/{uuid}.mp3
    - `arquivo_tamanho` → 26214400

11. **Job de transcrição enfileirado** (comentado por enquanto, Epic 4)

**Then** upload resumível funciona completamente com retry automático

---

## Tasks / Subtasks

### 1. Install TUS Dependencies (AC: Dependencies Installation)

- [ ] Executar `npm install @tus/server@2.3.0 @tus/s3-store@2.0.1 @aws-sdk/client-s3`
- [ ] Verificar package.json tem as versões corretas
- [ ] Verificar que Node.js >= 20.19.0 (requirement do @tus/server)

### 2. Create TUS Module Structure (AC: TUS Module Structure)

- [ ] Criar `src/modules/tus/tus.module.ts`
- [ ] Criar `src/modules/tus/tus.service.ts`
- [ ] Criar `src/modules/tus/tus.controller.ts`
- [ ] Importar TusModule em `src/app.module.ts`

### 3. Configure S3 Client & Store (AC: TUS Service Configuration)

- [ ] Adicionar variáveis de ambiente ao `.env.example`:
  - `S3_REGION=us-east-1`
  - `S3_ENDPOINT=http://localhost:9000` (MinIO dev)
  - `S3_ACCESS_KEY=minioadmin`
  - `S3_SECRET_KEY=minioadmin`
  - `S3_BUCKET=ressoa-uploads`
- [ ] Criar `S3Client` configurado com credentials e endpoint
- [ ] Criar `S3Store` com `partSize: 8 * 1024 * 1024` (8MB chunks)
- [ ] Validar conexão S3/MinIO funciona

### 4. Implement TUS Server Configuration (AC: TUS Service Configuration)

- [ ] Configurar `Server` do @tus/server com:
  - [ ] `path: '/api/v1/uploads'`
  - [ ] `datastore: S3Store`
  - [ ] `maxSize: 2GB`
  - [ ] `namingFunction`: padrão `{escola_id}/{professor_id}/{uuid}.{ext}`
- [ ] Implementar `onUploadCreate` hook:
  - [ ] Validar metadata obrigatória (escola_id, professor_id, turma_id, data, aula_id)
  - [ ] Validar formato de áudio (mp3, wav, m4a, webm)
  - [ ] Validar tamanho (não vazio, max 2GB)
  - [ ] Atualizar aula: `status_processamento = 'UPLOAD_PROGRESSO'`
  - [ ] ✅ **CRITICAL**: Validar `escola_id` no WHERE clause (multi-tenancy)
- [ ] Implementar `onUploadFinish` hook:
  - [ ] Atualizar aula com `arquivo_url`, `arquivo_tamanho`
  - [ ] Atualizar `status_processamento = 'AGUARDANDO_TRANSCRICAO'`
  - [ ] ✅ **CRITICAL**: Validar `escola_id` no WHERE clause (multi-tenancy)
  - [ ] Comentar enfileiramento Bull (Epic 4): `// await bullQueue.add('transcribe-aula', { aulaId })`

### 5. Create TUS Controller with JWT Guard (AC: TUS Controller, JWT Auth)

- [ ] Criar endpoint `@All('*')` que delega para `tusService.getServer().handle()`
- [ ] Adicionar `@UseGuards(JwtAuthGuard)` no controller
- [ ] Implementar `onIncomingRequest` hook no TUS server:
  - [ ] Validar que `req.user` existe (JWT já validado)
  - [ ] Validar ownership: `metadata.professor_id === req.user.userId`
  - [ ] Validar multi-tenancy: `metadata.escola_id === req.user.escolaId`
  - [ ] Throw error se validações falharem

### 6. Document Cleanup Strategy (AC: Cleanup Abandonados)

- [ ] Adicionar comentário no código sobre cleanup (Epic 4):
  ```typescript
  // TODO (Epic 4): Implementar Bull scheduled job para cleanup de uploads abandonados
  // - Job diário às 3h AM
  // - Query uploads expirados (TUS metadata)
  // - Deletar do S3: s3.deleteObject()
  // - Atualizar aulas órfãs: status_processamento = 'ERRO'
  ```
- [ ] Documentar S3 Lifecycle policy para auto-abort multipart uploads após 7 dias

### 7. Add E2E Tests (AC: Upload Resumível E2E)

- [ ] Criar `test/tus-upload.e2e-spec.ts`
- [ ] Setup: Mock S3 client ou usar MinIO testcontainer
- [ ] Testar fluxo completo dos 11 steps do AC:
  - [ ] POST initiate upload → retorna 201 + Location
  - [ ] Aula status → UPLOAD_PROGRESSO
  - [ ] PATCH upload chunk (0-8MB) → retorna 204 + Upload-Offset: 8MB
  - [ ] HEAD check progress → retorna 200 + Upload-Offset: 8MB
  - [ ] PATCH resume upload (8MB-16MB) → retorna 204 + Upload-Offset: 16MB
  - [ ] PATCH final chunk (16MB-25MB) → completa upload
  - [ ] onUploadFinish triggered → aula atualizada (AGUARDANDO_TRANSCRICAO, arquivo_url, tamanho)
- [ ] Testar validações de segurança:
  - [ ] Sem JWT → 401 Unauthorized
  - [ ] JWT de outro professor → 403 Forbidden (ownership)
  - [ ] JWT de outra escola → 403 Forbidden (multi-tenancy)
  - [ ] Formato inválido (video/mp4) → 400 Bad Request
  - [ ] Arquivo vazio → 400 Bad Request
  - [ ] Arquivo >2GB → 413 Payload Too Large
- [ ] Testar metadata obrigatória:
  - [ ] Faltando aula_id → 400 Bad Request
  - [ ] Faltando escola_id → 400 Bad Request

---

## Dev Notes

### **🔴 CRITICAL: Multi-Tenancy Security in TUS Hooks**

**⚠️ BLOCKING REQUIREMENT:** Toda operação Prisma dentro de hooks TUS DEVE incluir `escola_id` no WHERE clause.

#### Pattern: Validar Escola & Professor em Hooks

```typescript
// ✅ CORRECT: onUploadCreate
async onUploadCreate(req, res, upload) {
  const { escola_id, professor_id, aula_id } = upload.metadata;

  // Validar que aula pertence ao professor E escola
  const aula = await prisma.aula.findUnique({
    where: {
      id: aula_id,
      escola_id: escola_id, // ✅ Multi-tenancy
      professor_id: professor_id, // ✅ Ownership
    },
  });

  if (!aula) {
    throw new Error('Aula não encontrada ou sem permissão');
  }

  // Atualizar status
  await prisma.aula.update({
    where: {
      id: aula_id,
      escola_id: escola_id, // ✅ OBRIGATÓRIO!
    },
    data: { status_processamento: 'UPLOAD_PROGRESSO' },
  });
}
```

#### Pattern: Validar JWT User vs Metadata

```typescript
// ✅ CORRECT: onIncomingRequest
async onIncomingRequest(req, res) {
  const { professor_id, escola_id } = req.upload?.metadata || {};

  // req.user já injetado pelo JwtAuthGuard
  if (professor_id !== req.user.userId) {
    throw new Error('Forbidden: Upload só permitido para aulas próprias');
  }

  if (escola_id !== req.user.escolaId) {
    throw new Error('Forbidden: Escola não corresponde ao usuário');
  }
}
```

**Reference:** `project-context.md` - Multi-Tenancy Rules (#1-5)

---

### **TUS Protocol Specifications**

**Protocol Version:** TUS Resumable Upload Protocol 1.0.x

**Required Headers:**

| Header | Exemplo | Quando Usar |
|--------|---------|-------------|
| `Tus-Resumable` | `1.0.0` | TODAS requests/responses (exceto OPTIONS) |
| `Upload-Length` | `26214400` | POST (initiate upload) |
| `Upload-Offset` | `8388608` | PATCH (upload chunk), HEAD (check progress) |
| `Upload-Metadata` | `filename bXVzaWNhLm1wMw==,filetype YXVkaW8vbXBlZw==` | POST (optional, base64-encoded key-value pairs) |
| `Content-Type` | `application/offset+octet-stream` | PATCH (upload chunk) |
| `Authorization` | `Bearer {jwt_token}` | TODAS requests (nossa implementação) |

**HTTP Methods:**

| Method | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/api/v1/uploads` | Iniciar upload, retorna Location header com upload-id |
| PATCH | `/api/v1/uploads/{id}` | Enviar chunk, retorna Upload-Offset atualizado |
| HEAD | `/api/v1/uploads/{id}` | Verificar progresso, retorna Upload-Offset atual |
| DELETE | `/api/v1/uploads/{id}` | Cancelar upload, deleta arquivo do S3 |
| OPTIONS | `/api/v1/uploads` | Descobrir capacidades do servidor (Tus-Version, Tus-Extension) |

**Upload Metadata (base64-encoded):**

```typescript
// Cliente envia (exemplo em JavaScript):
const metadata = {
  filename: 'musica.mp3',
  filetype: 'audio/mpeg',
  aula_id: 'uuid-123',
  escola_id: 'uuid-escola',
  professor_id: 'uuid-prof',
  turma_id: 'uuid-turma',
  data: '2026-02-11',
};

// Encode para base64:
const encodedMetadata = Object.entries(metadata)
  .map(([key, value]) => `${key} ${btoa(value)}`)
  .join(',');

// Header:
'Upload-Metadata': encodedMetadata
```

**Security Note:** Upload-Metadata pode ser explorado para header smuggling. Sempre sanitizar valores antes de usar como HTTP headers.

---

### **S3 Multipart Upload Integration**

**Chunk Size Constraints (AWS S3):**
- **Minimum per-part:** 5 MB (exceto última parte pode ser menor)
- **Maximum per-part:** 5 GB
- **Maximum total parts:** 10,000
- **TUS client chunk size:** Deve ser >= 5MB para evitar rejeição S3

**Optimal Part Size:**
- **8MB chunks** (configurado no S3Store): Equilíbrio entre performance e memória
- Para arquivos de 50MB (áudio 50min): ~7 parts
- Para arquivos de 100MB: ~13 parts

**S3 Lifecycle Policy (Cleanup Automático):**

```json
{
  "Rules": [
    {
      "Id": "AbortIncompleteMultipartUpload",
      "Status": "Enabled",
      "AbortIncompleteMultipartUploadDays": 7
    }
  ]
}
```

**Aplicar via AWS CLI:**
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket ressoa-uploads \
  --lifecycle-configuration file://lifecycle.json
```

**MinIO Equivalent:**
```bash
mc ilm add myminio/ressoa-uploads --expire-delete-incomplete-mpu-days 7
```

---

### **Architecture Compliance**

**Tech Stack (Story 0.2):**
- **Framework:** NestJS com TypeScript strict mode
- **ORM:** Prisma Client
- **Storage:** AWS S3 ou MinIO (S3-compatible)
- **Auth:** Passport JWT + Guards

**Module Structure:**

```
src/modules/tus/
├── tus.module.ts         # Importa PrismaModule, ConfigModule
├── tus.controller.ts     # REST endpoints com JwtAuthGuard
├── tus.service.ts        # TUS Server configuration
└── tests/
    └── tus.e2e-spec.ts   # E2E tests
```

**Environment Variables:**

```bash
# .env (development)
S3_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000  # MinIO local
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=ressoa-uploads

# .env (production)
S3_REGION=sa-east-1
S3_ENDPOINT=https://s3.sa-east-1.amazonaws.com  # AWS S3
S3_ACCESS_KEY={aws_access_key}
S3_SECRET_KEY={aws_secret_key}
S3_BUCKET=ressoa-uploads-prod
```

**Docker Compose (Development):**

```yaml
services:
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
```

---

### **Previous Story Learnings (Story 3.1)**

**✅ Patterns to Reuse:**

1. **Multi-Tenancy Enforcement:**
   ```typescript
   // Story 3.1 established this pattern - REUSE in TUS hooks
   const escolaId = this.prisma.getEscolaIdOrThrow(); // From TenantInterceptor

   await prisma.aula.update({
     where: {
       id: aulaId,
       escola_id: escolaId, // ✅ ALWAYS include
     },
     data: { ... },
   });
   ```

2. **DTOs com class-validator:**
   - Story 3.1 usou `CreateAulaDto`, `UpdateAulaDto` com decorators
   - TUS não usa DTOs (metadata vem em headers), mas validar metadata manualmente

3. **E2E Tests Structure:**
   ```typescript
   // Story 3.1 pattern
   it('should enforce tenant isolation', async () => {
     const escola1 = await createTestSchool('Escola A');
     const escola2 = await createTestSchool('Escola B');

     // User 1 cria recurso
     const { body: recurso } = await request(app).post('/endpoint')...

     // User 2 tenta acessar → 404/403
     await request(app).get(`/endpoint/${recurso.id}`)
       .set('Authorization', `Bearer ${user2Token}`)
       .expect(404);
   });
   ```

4. **State Transition Validation:**
   - Story 3.1 implementou validações: CRIADA → AGUARDANDO_TRANSCRICAO (professor)
   - Story 3.2 adiciona: CRIADA → UPLOAD_PROGRESSO → AGUARDANDO_TRANSCRICAO (sistema)

**⚠️ Avoid from Story 3.1:**
- Não usar Controllers para lógica de negócio (manter em Service)
- Não esquecer `escola_id` em nenhuma query Prisma

---

### **Testing Requirements**

**E2E Tests (Obrigatório):**

1. **Happy Path - Upload Resumível Completo:**

```typescript
it('should upload file with resumption', async () => {
  const professorToken = await loginAsProfessor();
  const fileSize = 25 * 1024 * 1024; // 25MB
  const chunkSize = 8 * 1024 * 1024; // 8MB

  // 1. Criar aula
  const { body: aula } = await request(app)
    .post('/api/v1/aulas')
    .set('Authorization', `Bearer ${professorToken}`)
    .send({ turma_id: testTurma.id, data: '2026-02-11', tipo_entrada: 'AUDIO' })
    .expect(201);

  expect(aula.status_processamento).toBe('CRIADA');

  // 2. Initiate upload
  const metadata = encodeMetadata({
    filename: 'test.mp3',
    filetype: 'audio/mpeg',
    aula_id: aula.id,
    escola_id: testEscola.id,
    professor_id: testProfessor.id,
    turma_id: testTurma.id,
    data: '2026-02-11',
  });

  const { headers } = await request(app)
    .post('/api/v1/uploads')
    .set('Authorization', `Bearer ${professorToken}`)
    .set('Upload-Length', fileSize.toString())
    .set('Upload-Metadata', metadata)
    .set('Tus-Resumable', '1.0.0')
    .expect(201);

  const uploadUrl = headers.location;
  expect(uploadUrl).toBeDefined();

  // 3. Verificar status atualizado
  const aulaAfterInit = await prisma.aula.findUnique({ where: { id: aula.id } });
  expect(aulaAfterInit.status_processamento).toBe('UPLOAD_PROGRESSO');

  // 4. Upload first chunk
  await request(app)
    .patch(uploadUrl)
    .set('Authorization', `Bearer ${professorToken}`)
    .set('Upload-Offset', '0')
    .set('Content-Type', 'application/offset+octet-stream')
    .set('Tus-Resumable', '1.0.0')
    .send(Buffer.alloc(chunkSize))
    .expect(204);

  // 5. Check progress
  const { headers: headHeaders } = await request(app)
    .head(uploadUrl)
    .set('Authorization', `Bearer ${professorToken}`)
    .set('Tus-Resumable', '1.0.0')
    .expect(200);

  expect(headHeaders['upload-offset']).toBe(chunkSize.toString());

  // 6. Resume upload (second chunk)
  await request(app)
    .patch(uploadUrl)
    .set('Authorization', `Bearer ${professorToken}`)
    .set('Upload-Offset', chunkSize.toString())
    .set('Content-Type', 'application/offset+octet-stream')
    .set('Tus-Resumable', '1.0.0')
    .send(Buffer.alloc(chunkSize))
    .expect(204);

  // 7. Final chunk (remaining 9MB)
  await request(app)
    .patch(uploadUrl)
    .set('Authorization', `Bearer ${professorToken}`)
    .set('Upload-Offset', (chunkSize * 2).toString())
    .set('Content-Type', 'application/offset+octet-stream')
    .set('Tus-Resumable', '1.0.0')
    .send(Buffer.alloc(fileSize - chunkSize * 2))
    .expect(204);

  // 8. Verify aula updated
  const aulaFinal = await prisma.aula.findUnique({ where: { id: aula.id } });
  expect(aulaFinal.status_processamento).toBe('AGUARDANDO_TRANSCRICAO');
  expect(aulaFinal.arquivo_url).toContain('s3://');
  expect(aulaFinal.arquivo_tamanho).toBe(fileSize);
});
```

2. **Security Tests:**

```typescript
it('should reject upload without JWT', async () => {
  await request(app)
    .post('/api/v1/uploads')
    .set('Upload-Length', '1000000')
    .set('Tus-Resumable', '1.0.0')
    .expect(401);
});

it('should enforce multi-tenancy isolation', async () => {
  const escola1 = await createTestSchool('Escola A');
  const escola2 = await createTestSchool('Escola B');

  const user1Token = await loginUser(escola1.professorId);
  const user2Token = await loginUser(escola2.professorId);

  // User 1 cria aula
  const { body: aula } = await request(app)
    .post('/api/v1/aulas')
    .set('Authorization', `Bearer ${user1Token}`)
    .send({ turma_id: escola1.turmaId, data: '2026-02-11', tipo_entrada: 'AUDIO' })
    .expect(201);

  // User 2 tenta fazer upload para aula de User 1 (via metadata)
  const metadata = encodeMetadata({
    aula_id: aula.id,
    escola_id: escola2.id, // ❌ Escola diferente!
    professor_id: escola2.professorId,
    turma_id: escola2.turmaId,
    data: '2026-02-11',
  });

  await request(app)
    .post('/api/v1/uploads')
    .set('Authorization', `Bearer ${user2Token}`)
    .set('Upload-Length', '1000000')
    .set('Upload-Metadata', metadata)
    .set('Tus-Resumable', '1.0.0')
    .expect(403); // ✅ Blocked
});

it('should reject invalid audio format', async () => {
  const metadata = encodeMetadata({
    filename: 'video.mp4',
    filetype: 'video/mp4', // ❌ Not allowed
    aula_id: testAula.id,
    escola_id: testEscola.id,
    professor_id: testProfessor.id,
    turma_id: testTurma.id,
    data: '2026-02-11',
  });

  await request(app)
    .post('/api/v1/uploads')
    .set('Authorization', `Bearer ${professorToken}`)
    .set('Upload-Length', '1000000')
    .set('Upload-Metadata', metadata)
    .set('Tus-Resumable', '1.0.0')
    .expect(400);
});
```

---

### **Dependencies & Imports**

```typescript
// TUS
import { Server } from '@tus/server';
import { S3Store } from '@tus/s3-store';
import { S3Client } from '@aws-sdk/client-s3';

// NestJS
import { Controller, Injectable, All, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Prisma
import { PrismaService } from '../../prisma/prisma.service';
```

---

### **References**

- **[Source: epics.md - Epic 3, Story 3.2]** - Complete acceptance criteria, TUS configuration
- **[Source: architecture.md - AD-5.1]** - Docker + Docker Compose, S3/MinIO setup
- **[Source: project-context.md]** - Multi-tenancy rules (#1-5), security patterns
- **[Source: 3-1-backend-aula-entity-basic-crud.md]** - Previous story learnings, multi-tenancy patterns
- **[TUS Protocol Specification]** - https://tus.io/protocols/resumable-upload
- **[@tus/server npm]** - https://www.npmjs.com/package/@tus/server
- **[@tus/s3-store npm]** - https://www.npmjs.com/package/@tus/s3-store
- **[AWS S3 Multipart Upload]** - https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html

---

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_Lista de arquivos criados/modificados pelo dev agent:_

- [ ] `src/modules/tus/tus.module.ts`
- [ ] `src/modules/tus/tus.service.ts`
- [ ] `src/modules/tus/tus.controller.ts`
- [ ] `src/app.module.ts` (register TusModule)
- [ ] `test/tus-upload.e2e-spec.ts`
- [ ] `.env.example` (add S3 config variables)
- [ ] `docker-compose.yml` (add MinIO service for dev)
- [ ] `package.json` (add @tus/server, @tus/s3-store, @aws-sdk/client-s3)
