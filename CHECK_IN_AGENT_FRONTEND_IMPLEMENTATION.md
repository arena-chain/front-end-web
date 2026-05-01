# Check-in agents — frontend implementation (single guide)

This document is the **only** guide you need to wire **check-in agents** end-to-end on the frontend: **admin web** creates agents; **mobile** logs in and scans tickets.

**Role value (API / JWT):** `check_in_agent`  
**Human labels:** “Check-in Agent”, “CHECK-IN AGENT”

---

## Backend contracts (reference)

| Flow | Method | Path | Auth |
|------|--------|------|------|
| Admin creates agent | `POST` | `/api/admin/check-in-agents` | `Bearer <admin JWT>`; role must be `admin` |
| Agent login (mobile) | `POST` | `/api/auth/login` | Public |
| Validate / scan ticket | `POST` | `/api/tickets/validate` | `Bearer <agent or admin JWT>`; roles `admin` or `check_in_agent` |

Optional (OTP flow): generic register with `role: "check_in_agent"` may exist depending on your backend branch; **preferred for dashboard UX** is `POST /api/admin/check-in-agents` so agents are created verified and ready without self-service OTP.

---

## Part A — Admin web (`/admin/users` or equivalent)

### A.1 Goal

1. Admin opens **Users**.
2. **Add New User** → role **Check-in Agent**.
3. Submit → backend creates user with role `check_in_agent`.
4. Agent uses email/password on mobile → scanner works.

### A.2 Create agent API

**Request**

```http
POST /api/admin/check-in-agents
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

```json
{
  "email": "checkin.agent@arena.test",
  "nickname": "Gate Agent 01",
  "password": "StrongPassword123!",
  "region": "EUROPE",
  "country": "TUNISIA"
}
```

`region` and `country` are optional.

**Success response (shape)**

```json
{
  "id": "…",
  "email": "checkin.agent@arena.test",
  "nickname": "Gate Agent 01",
  "role": "check_in_agent",
  "region": "EUROPE",
  "country": "TUNISIA",
  "isEmailVerified": true,
  "isActive": true
}
```

### A.3 UI changes

1. **Role picker** in Add User modal: add option  
   - Label: `Check-in Agent`  
   - Value: `check_in_agent`

2. **Submit routing**  
   - If `role === 'check_in_agent'` → `POST /api/admin/check-in-agents` with email, nickname, password, optional region/country.  
   - Else → keep your existing create-user/register logic.

3. **Example (pseudo-code)**

```ts
async function submitAddUser(form: AddUserForm, accessToken: string) {
  if (form.role === 'check_in_agent') {
    await fetch(`${API_BASE}/api/admin/check-in-agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        email: form.email,
        nickname: form.nickname,
        password: form.password,
        region: form.region || undefined,
        country: form.country || undefined,
      }),
    }).then(throwIfNotOk);
    return;
  }
  // …existing paths for player, manager, referee, admin, etc.
}
```

4. **Users table**  
   - Show role badge for `check_in_agent`.  
   - Optional filter tab: **Check-in Agents**.

5. **Validation**  
   - Email (required), nickname (required), password (required, min 8).  
   - Surface backend `message` on `400` / `409`.

6. **Errors**  
   - `401` → session expired, redirect to login.  
   - `403` → not admin.  
   - `409` / `400` → show API message (e.g. duplicate email).

### A.4 Admin QA checklist

- [ ] Role appears in Add User UI.  
- [ ] Create calls `/api/admin/check-in-agents` (not only generic register).  
- [ ] New row appears in users list with role `check_in_agent`.  
- [ ] Duplicate email handled gracefully.

---

## Part B — Mobile app (scanner)

### B.1 Login

`POST /api/auth/login`

```json
{
  "email": "checkin.agent@arena.test",
  "password": "StrongPassword123!"
}
```

Use returned `accessToken` (and refresh token if your app supports it). Expect `user.role === "check_in_agent"`.

**Routing:** after login, if role is `check_in_agent`, navigate to the **Scan** screen (hide normal player home unless you want a minimal shell).

### B.2 Scan ticket

`POST /api/tickets/validate`  
Header: `Authorization: Bearer <accessToken>`

```json
{
  "ticketNumber": "TKT-1714469440000-1234-0"
}
```

### B.3 QR payload

Tickets often encode JSON like:

```json
{
  "ticketNumber": "TKT-…",
  "tournament": "…",
  "user": "…",
  "type": "…"
}
```

Extract `ticketNumber` and send it to `/api/tickets/validate`. If the scanner returns raw text, try `JSON.parse`; on failure, treat the string as `ticketNumber`.

### B.4 Response semantics

| Situation | Typical `success` | `scanStatus` | UX |
|-----------|-------------------|--------------|-----|
| First valid scan | `true` | `CONFIRMED` | Green — access granted |
| Already used | `false` | `USED` | Red — deny entry; show `message` / timestamp if present |
| Not found / cancelled / expired | `false` | often `USED` or absent | Red — show `message` |

**Scanner UX**

1. Debounce / disable scan while one request is in flight.  
2. Show full-screen result 1–2s, then return to camera.  
3. On `401` / `403`, force re-login.

### B.5 Security

- Always send JWT on validate.  
- Do not expose the validate action in UI for roles other than `check_in_agent` / `admin`.  
- Treat role from login response; re-validate on critical routes if needed.

### B.6 Mobile QA checklist

- [ ] Agent login lands on scanner.  
- [ ] Valid ticket → `CONFIRMED`, entry allowed.  
- [ ] Same ticket again → `USED`, denied.  
- [ ] Random code → error state.  
- [ ] Player token calling validate → `403`.

---

## End-to-end smoke test

1. Admin creates agent via web → success response with `check_in_agent`.  
2. Agent logs in on mobile.  
3. Scan fresh ticket → `CONFIRMED`.  
4. Scan again → `USED`.

---

## Config

- **API base:** use your env (e.g. `VITE_API_URL` pointing at `http://localhost:3000` or production host).  
- Requests use the `/api` prefix as shown above.
