# Login Page - Manual E2E Test Checklist

## Prerequisites

- **Backend running:** `cd ressoa-backend && npm run start:dev` (port 3000)
- **Frontend running:** `cd ressoa-frontend && npm run dev` (port 5173)
- **Database seeded:** `cd ressoa-backend && npx prisma db seed`

## Test Cases

### Test 1: Page Renders
**Steps:**
1. Navigate to `http://localhost:5173/login`

**Expected:**
- Page loads with "Ressoa AI" logo
- Gradient background (Deep Navy → Tech Blue)
- Card centered on screen
- Form with Email and Password fields visible

---

### Test 2: Form Validation - Empty Submit
**Steps:**
1. Click "Entrar" button without filling any fields

**Expected:**
- Error message under Email: "Email inválido"
- Error message under Password: "Senha deve ter no mínimo 8 caracteres"
- Form does NOT submit

---

### Test 3: Form Validation - Invalid Email
**Steps:**
1. Type `test@` in Email field
2. Tab to Password field

**Expected:**
- Error message under Email: "Email inválido"
- Error appears instantly (client-side validation)

---

### Test 4: Form Validation - Short Password
**Steps:**
1. Type `1234567` (7 characters) in Password field
2. Tab out of field

**Expected:**
- Error message under Password: "Senha deve ter no mínimo 8 caracteres"

---

### Test 5: Successful Login - Professor Role
**Steps:**
1. Email: `professor@escolademo.com`
2. Password: `Demo@123`
3. Click "Entrar"

**Expected:**
- Button text changes to "Entrando..." (loading state)
- Toast notification appears: "Bem-vindo, João Professor!"
- Redirect to `/minhas-aulas`
- Placeholder page shows "Minhas Aulas (Página em desenvolvimento - Epic 3)"

---

### Test 6: LocalStorage Persistence
**Steps:**
1. After successful login (Test 5), open DevTools
2. Navigate to Application → Local Storage → `http://localhost:5173`
3. Look for key `auth-storage`

**Expected:**
- Key `auth-storage` exists
- Value contains JSON with:
  - `user` (id, email, nome, role, escola_id)
  - `accessToken` (JWT string)
  - `refreshToken` (UUID string)

---

### Test 7: Page Reload - Session Persistence
**Steps:**
1. While logged in (from Test 5), press `F5` to reload the page

**Expected:**
- User remains logged in
- Stays on `/minhas-aulas` page
- No redirect to `/login`

---

### Test 8: Protected Route Without Authentication
**Steps:**
1. Open DevTools Console
2. Run: `localStorage.clear()`
3. Reload page (`F5`)
4. Navigate to `http://localhost:5173/minhas-aulas`

**Expected:**
- Automatic redirect to `/login`
- Login page displays

---

### Test 9: Logout Flow
**Steps:**
1. Login successfully (Test 5)
2. Open DevTools Console
3. Run: `localStorage.clear(); window.location.href = '/minhas-aulas';`

**Expected:**
- Redirect to `/login` (because `/minhas-aulas` is protected)

---

### Test 10: Responsiveness
**Steps:**
1. Open DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Test Mobile (375px width)
3. Test Tablet (768px width)
4. Test Desktop (1920px width)

**Expected:**
- **Mobile:** Card takes most of screen width (px-4 padding), centered
- **Tablet:** Card max-width 28rem, centered
- **Desktop:** Card max-width 28rem, centered
- **All sizes:** Background gradient visible, form readable

---

### Test 11: Keyboard Navigation
**Steps:**
1. Reload `/login` page
2. Press `Tab` repeatedly
3. Press `Shift+Tab` to go backwards

**Expected Tab Order:**
1. Email field (focus ring visible)
2. Password field (focus ring visible)
3. "Entrar" button (focus ring visible)
4. "Esqueceu sua senha?" link (focus ring visible)

**Additional:**
- Pressing `Enter` on any field OR button submits the form

---

### Test 12: Coordenador Role Login
**Steps:**
1. Logout (clear localStorage)
2. Email: `coordenador@escolademo.com`
3. Password: `Demo@123`
4. Click "Entrar"

**Expected:**
- Toast: "Bem-vindo, Maria Coordenadora!"
- Redirect to `/dashboard-coordenador`
- Placeholder: "Dashboard Coordenador (Página em desenvolvimento - Epic 7)"

---

### Test 13: Diretor Role Login
**Steps:**
1. Logout (clear localStorage)
2. Email: `diretor@escolademo.com`
3. Password: `Demo@123`
4. Click "Entrar"

**Expected:**
- Toast: "Bem-vindo, Carlos Diretor!"
- Redirect to `/dashboard-diretor`
- Placeholder: "Dashboard Diretor (Página em desenvolvimento - Epic 7)"

---

### Test 14: Invalid Credentials
**Steps:**
1. Email: `test@invalid.com`
2. Password: `WrongPassword123`
3. Click "Entrar"

**Expected:**
- Toast error: "Email ou senha incorretos"
- Stays on `/login` page
- Form fields retain their values

---

### Test 15: Backend Down (Error Handling)
**Steps:**
1. Stop backend server (`Ctrl+C` in backend terminal)
2. Try to login with valid credentials

**Expected:**
- Toast error: "Erro ao fazer login. Tente novamente."
- Stays on `/login` page

---

### Test 16: Forgot Password Link
**Steps:**
1. Click "Esqueceu sua senha?" link

**Expected:**
- Navigates to `/forgot-password`
- (Currently shows 404 - will be implemented in Epic 2+)

---

## Accessibility Validation

### Lighthouse Audit
**Steps:**
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Accessibility" only
4. Generate report

**Expected:**
- Accessibility score: **≥95** (target 100)
- No major violations

### Screen Reader Test (Optional)
**Steps:**
1. Enable screen reader (NVDA/VoiceOver)
2. Navigate through form using Tab
3. Submit form with errors

**Expected:**
- All labels read correctly
- Error messages announced
- Loading state announced ("Entrando...")

---

## Pass/Fail Criteria

**Story passes if:**
- ✅ All 16 test cases pass
- ✅ Build completes without TypeScript errors
- ✅ Lighthouse Accessibility ≥90
- ✅ No console errors on happy path

**Current Status:** ✅ READY FOR TESTING
