# TUS Upload Server - Manual Testing Instructions (Story 3.2)

Due to ESM dependency constraints with @tus/server (uses `srvx` which is ESM-only), automated E2E tests cannot run in Jest without significant configuration changes.

This document provides manual testing instructions using `curl` to verify TUS upload functionality.

## Prerequisites

1. Start development environment:
```bash
docker-compose up -d
npm run start:dev
```

2. Login as professor to get JWT token:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@escolademo.com","senha":"Test@123"}' \
  | jq -r '.access_token')

echo "Token: $TOKEN"
```

3. Get escola_id, professor_id, turma_id from database:
```bash
# Get IDs (run in PostgreSQL)
SELECT id, nome FROM escola WHERE cnpj = '12.345.678/0001-90';
SELECT id, nome FROM usuario WHERE email = 'professor@escolademo.com';
SELECT id, nome FROM turma WHERE escola_id = '<escola_id_from_above>' LIMIT 1;
```

## Test Case 1: Create Aula + Initiate Upload

```bash
# 1. Create aula
AULA_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/aulas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "turma_id": "<your_turma_id>",
    "data": "2026-02-11",
    "tipo_entrada": "AUDIO"
  }')

AULA_ID=$(echo $AULA_RESPONSE | jq -r '.id')
echo "Aula ID: $AULA_ID"
echo "Status: $(echo $AULA_RESPONSE | jq -r '.status_processamento')"  # Should be CRIADA

# 2. Encode metadata to base64
function encode_metadata() {
  local filename=$(echo -n "test.mp3" | base64)
  local filetype=$(echo -n "audio/mpeg" | base64)
  local aula_id=$(echo -n "$AULA_ID" | base64)
  local escola_id=$(echo -n "<your_escola_id>" | base64)
  local professor_id=$(echo -n "<your_professor_id>" | base64)
  local turma_id=$(echo -n "<your_turma_id>" | base64)
  local data=$(echo -n "2026-02-11" | base64)
  
  echo "filename $filename,filetype $filetype,aula_id $aula_id,escola_id $escola_id,professor_id $professor_id,turma_id $turma_id,data $data"
}

METADATA=$(encode_metadata)
echo "Metadata: $METADATA"

# 3. Initiate TUS upload
INIT_RESPONSE=$(curl -i -X POST http://localhost:3000/api/v1/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Upload-Length: 26214400" \
  -H "Upload-Metadata: $METADATA" \
  -H "Tus-Resumable: 1.0.0")

echo "$INIT_RESPONSE"

# Extract Location header
UPLOAD_URL=$(echo "$INIT_RESPONSE" | grep -i "^Location:" | awk '{print $2}' | tr -d '\r')
echo "Upload URL: $UPLOAD_URL"
```

**Expected Results:**
- HTTP Status: 201 Created
- Location header: `/api/v1/uploads/<upload-id>`
- Aula status in database: `UPLOAD_PROGRESSO`

## Test Case 2: Upload Chunks (Resumable)

```bash
# 1. Create test file (25MB)
dd if=/dev/zero of=test.mp3 bs=1M count=25

# 2. Upload first chunk (8MB)
curl -X PATCH "http://localhost:3000$UPLOAD_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Upload-Offset: 0" \
  -H "Content-Type: application/offset+octet-stream" \
  -H "Tus-Resumable: 1.0.0" \
  --data-binary @<(dd if=test.mp3 bs=1M count=8 2>/dev/null) \
  -i

# 3. Check progress with HEAD
curl -I "http://localhost:3000$UPLOAD_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Tus-Resumable: 1.0.0"

# Should return Upload-Offset: 8388608 (8MB in bytes)

# 4. Resume upload (second chunk: 8MB-16MB)
curl -X PATCH "http://localhost:3000$UPLOAD_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Upload-Offset: 8388608" \
  -H "Content-Type: application/offset+octet-stream" \
  -H "Tus-Resumable: 1.0.0" \
  --data-binary @<(dd if=test.mp3 bs=1M skip=8 count=8 2>/dev/null) \
  -i

# 5. Final chunk (16MB-25MB)
curl -X PATCH "http://localhost:3000$UPLOAD_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Upload-Offset: 16777216" \
  -H "Content-Type: application/offset+octet-stream" \
  -H "Tus-Resumable: 1.0.0" \
  --data-binary @<(dd if=test.mp3 bs=1M skip=16 count=9 2>/dev/null) \
  -i

# 6. Verify aula status updated
curl -s http://localhost:3000/api/v1/aulas/$AULA_ID \
  -H "Authorization: Bearer $TOKEN" \
  | jq '{status: .status_processamento, url: .arquivo_url, size: .arquivo_tamanho}'
```

**Expected Results:**
- Each PATCH returns HTTP 204 No Content
- Each response includes `Upload-Offset` header with updated byte count
- Final aula status: `AGUARDANDO_TRANSCRICAO`
- `arquivo_url`: `s3://ressoa-uploads/<escola_id>/<professor_id>/<uuid>.mp3`
- `arquivo_tamanho`: 26214400 (25MB in bytes)

## Test Case 3: Security Validations

### 3.1: Missing JWT Token
```bash
curl -i -X POST http://localhost:3000/api/v1/uploads \
  -H "Upload-Length: 1000000" \
  -H "Tus-Resumable: 1.0.0"
```
**Expected:** HTTP 401 Unauthorized

### 3.2: Invalid Audio Format
```bash
METADATA_INVALID=$(echo -n "video.mp4" | base64 | awk '{print "filename "$1}')
METADATA_INVALID="$METADATA_INVALID,filetype $(echo -n 'video/mp4' | base64)"
# Add other required metadata...

curl -i -X POST http://localhost:3000/api/v1/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Upload-Length: 1000000" \
  -H "Upload-Metadata: $METADATA_INVALID" \
  -H "Tus-Resumable: 1.0.0"
```
**Expected:** HTTP 400 Bad Request - "Formato não suportado"

### 3.3: Empty File
```bash
curl -i -X POST http://localhost:3000/api/v1/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Upload-Length: 0" \
  -H "Upload-Metadata: $METADATA" \
  -H "Tus-Resumable: 1.0.0"
```
**Expected:** HTTP 400 Bad Request - "Arquivo vazio"

### 3.4: File > 2GB
```bash
curl -i -X POST http://localhost:3000/api/v1/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Upload-Length: 2147483649" \
  -H "Upload-Metadata: $METADATA" \
  -H "Tus-Resumable: 1.0.0"
```
**Expected:** HTTP 413 Payload Too Large

## Test Case 4: Verify MinIO Storage

```bash
# Access MinIO Console: http://localhost:9001
# Login: minioadmin / minioadmin
# Navigate to bucket: ressoa-uploads
# Verify file structure: <escola_id>/<professor_id>/<uuid>.mp3
```

## Test Case 5: Cleanup

```bash
# Delete test file
rm test.mp3

# Delete test aula from database (optional)
# DELETE FROM aula WHERE id = '<aula_id>';
```

## Notes

- **Epic 4 TODO:** Cleanup job for abandoned uploads (Bull scheduler)
- **Epic 4 TODO:** Enqueue transcription job after upload completion
- **Limitation:** E2E tests skipped in Jest due to ESM dependency (@tus/server → srvx)
- **Alternative:** Integration tests can be added using Postman/Newman for CI/CD
