# API Quick-Reference — Cableado del Frontend

Complemento práctico de [ONBOARDING.md](./ONBOARDING.md). Acá va todo lo que necesitás para wirear los endpoints sin tener que volver a buscar.

---

## 1. Configuración

### Variables de entorno (frontend)

```env
# .env del frontend
VITE_API_URL=http://localhost:3000        # dev
# VITE_API_URL=https://api.forja.app      # prod
```

### CORS (backend ya lo soporta)

El backend lee `CORS_ORIGINS` como CSV. Asegurate de que tu origen del frontend esté incluido en EasyPanel:

```env
CORS_ORIGINS=https://forja.app,https://www.forja.app,http://localhost:5173
```

Si te aparece error de CORS, es esto. Pedíme que sume el dominio.

---

## 2. Formato de errores (importante)

Todos los errores devuelven JSON consistente:

### 400 — Validación Zod
```json
{
  "error": "validation_error",
  "issues": [
    {
      "code": "too_small",
      "minimum": 16,
      "path": ["age"],
      "message": "Number must be greater than or equal to 16"
    }
  ]
}
```

### 400/404/409 — Errores de negocio
```json
{
  "error": "user not found",
  "details": null
}
```

### 500 — Error interno
```json
{ "error": "internal_error" }
```

### Helper de manejo en el cliente

```ts
async function unwrap(res: Response) {
  if (res.ok) return res.json();
  const body = await res.json().catch(() => ({ error: "unknown_error" }));

  if (body.error === "validation_error") {
    // Mapeable a errores por field: body.issues[].path[0]
    const fieldErrors: Record<string, string> = {};
    for (const issue of body.issues ?? []) {
      const key = issue.path?.join(".") ?? "_root";
      fieldErrors[key] = issue.message;
    }
    throw new ValidationError(fieldErrors);
  }
  throw new ApiError(res.status, body.error ?? "unknown_error", body.details);
}

class ValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super("validation_error");
  }
}

class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}
```

---

## 3. Cliente reusable

```ts
// src/lib/api.ts
const BASE = import.meta.env.VITE_API_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return unwrap(res);
}

export const api = {
  // Onboarding
  startOnboarding: (body: { email?: string; phone_wa?: string }) =>
    request<{ user_id: string; onboarding_step: number; active: boolean }>(
      "/api/onboarding/start",
      { method: "POST", body: JSON.stringify(body) },
    ),

  getOnboarding: (userId: string) =>
    request<{
      user_id: string;
      name: string | null;
      email: string | null;
      phone_wa: string | null;
      onboarding_step: number;
      active: boolean;
    }>(`/api/onboarding/${userId}`),

  saveStep: <T = unknown>(userId: string, step: number, body: T) =>
    request<{ ok: true; step: number; result: unknown }>(
      `/api/onboarding/${userId}/step/${step}`,
      { method: "PUT", body: JSON.stringify(body) },
    ),

  parseTrainingPlan: (userId: string, text: string) =>
    request<{ ok: true; parsed: ParsedTrainingPlan }>(
      `/api/onboarding/${userId}/parse-training-plan`,
      { method: "POST", body: JSON.stringify({ text }) },
    ),

  saveConsent: (userId: string, body: {
    data_processing: true;
    international_transfer: true;
    nutrition_disclaimer: true;
  }) =>
    request<{ ok: true; consented_at: string }>(
      `/api/onboarding/${userId}/consent`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  // Helper
  searchFood: (q: string, limit = 10) =>
    request<FoodMatch[]>(`/api/food/search?q=${encodeURIComponent(q)}&limit=${limit}`),
};

export type ParsedTrainingPlan = {
  coach_name: string | null;
  days: Array<{
    day_of_week: number;
    session_type: string;
    session_name: string | null;
    duration_min: number | null;
    exercises: Array<{
      name: string;
      aliases: string[];
      sets: number | null;
      reps: string | null;
      load_kg: number | null;
      notes: string | null;
    }>;
  }>;
};

export type FoodMatch = {
  id: string;
  name: string;
  category: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  standard_portion_g: number | null;
  source: string;
  match_score: number;
  match_source: "prefix" | "fts" | "trgm";
};
```

---

## 4. Cableado paso a paso

### Pantalla Welcome → crear user

```ts
const { user_id } = await api.startOnboarding({
  email: emailFromForm,        // opcional, podés enviar undefined
  phone_wa: phoneFromForm,     // opcional
});
sessionStorage.setItem("forja_user_id", user_id);
navigate("/onboarding/1");
```

> El backend acepta `{}` vacío en `/start`. Si el user todavía no quiso dar email, mandalo sin nada.

---

### Pantalla Step N → guardar paso

```ts
const userId = sessionStorage.getItem("forja_user_id");
if (!userId) return navigate("/welcome");

try {
  await api.saveStep(userId, 1, {
    name: form.name,
    email: form.email,
    age: Number(form.age),
    sex: form.sex,
    weight_kg: Number(form.weight),
    height_cm: Number(form.height),
    body_fat_pct: form.bodyFat ? Number(form.bodyFat) : null,
  });
  navigate("/onboarding/2");
} catch (e) {
  if (e instanceof ValidationError) {
    setFieldErrors(e.fields);  // ej: { age: "Number must be...", weight_kg: "..." }
  } else {
    toast.error(e.message);
  }
}
```

Mismo patrón para steps 2–7. Los bodies están en [ONBOARDING.md](./ONBOARDING.md).

---

### Step 6 — Parser AI del plan (UX recomendada)

```ts
// 1. Textarea grande + botón "Parsear"
const parsed = await api.parseTrainingPlan(userId, textareaValue);

// 2. parsed.parsed.days es editable en la UI
//    El user revisa nombres de ejercicios, aliases, sets/reps, días.
//    Limitá el textarea a 8000 chars cliente-side (backend trunca).

// 3. Cuando confirma, mandás a step 6 con la estructura final
await api.saveStep(userId, 6, {
  coach_name: editedCoachName,
  training_days: parsed.parsed.days.map(d => ({
    day_of_week: d.day_of_week,
    session_type: d.session_type,
    session_name: d.session_name,
    duration_min: d.duration_min,
    exercises: d.exercises,  // ya viene en el formato correcto
  })),
});
```

**Fallback si Gemini falla** (400 con `"no pude interpretar el plan"`): mostrá un mensaje y dejá que cargue manualmente con un form (mismo body, sin pasar por parse).

---

### Reanudar onboarding interrumpido

```ts
// En la landing, si hay user_id en storage
const userId = sessionStorage.getItem("forja_user_id");
if (userId) {
  try {
    const state = await api.getOnboarding(userId);
    if (state.onboarding_step < 7) {
      navigate(`/onboarding/${state.onboarding_step + 1}`);
    } else {
      navigate("/onboarding/consent");
    }
  } catch {
    sessionStorage.removeItem("forja_user_id");
    navigate("/welcome");
  }
}
```

---

### Consentimiento final

```ts
await api.saveConsent(userId, {
  data_processing: true,
  international_transfer: true,
  nutrition_disclaimer: true,
});
navigate("/onboarding/done");  // pantalla "mandanos hola al WhatsApp"
```

Los tres campos **tienen que ser `true` literal**, no `false` ni `null`. Si el user destildó alguno, deshabilitá el botón.

---

## 5. Upload de archivos médicos (step 2) y plan nutricional (step 4)

El backend **no maneja multipart upload**. El frontend sube el archivo a su propio storage (S3 firmado, Cloudinary, Uploadthing, etc.) y manda solo la URL final.

```ts
// Ejemplo con Cloudinary (pseudo)
const url = await uploadToCloudinary(file);

await api.saveStep(userId, 2, {
  active_injuries: [...],
  past_injuries: [],
  chronic_conditions: [],
  allergies: [],
  medications: [],
  ecg_file_url: url,      // ← solo la URL
  xray_file_url: null,
  blood_work_url: null,
  medical_clearance_url: null,
});
```

Validación backend: `z.string().url().max(500).nullable().optional()` — tiene que ser URL válida o `null`.

---

## 6. Health check (debug)

```
GET /healthz
```

Te devuelve `{ ok: true, ts: "..." }` si la API está viva. Útil para un banner "backend caído" en el frontend.

---

## 7. Endpoints fuera del onboarding

| Endpoint | Para qué |
|----------|----------|
| `GET /api/food/search?q=X&limit=10` | Autocomplete de alimentos para step 7 (frequent meals) |
| `GET /healthz` | Liveness check |

Los demás endpoints (meal logs, training logs, queries, etc.) son consumidos solo por el bot de WhatsApp. El frontend web por ahora **solo hace onboarding**.

---

## 8. Troubleshooting

| Síntoma | Causa probable |
|---------|----------------|
| CORS error | Tu dominio no está en `CORS_ORIGINS`. Pedíme que lo sume. |
| 404 `user not found` | El `user_id` del storage es viejo o se borró el user. Volvé a `/start`. |
| 400 en `/consent` con campo `data_processing` | El user destildó algún checkbox. Tienen que ser los 3 en `true`. |
| 400 `no pude interpretar el plan` | Gemini no entendió el textarea. Pedí al user que reformatee o caiga al manual. |
| 500 al guardar step | Mirá los logs del backend, probable falla de DB o Gemini. |
| Headers `Content-Type` raros | El cliente arriba ya manda `application/json`. Si no, el body se interpreta como `text/plain`. |

---

## TL;DR endpoint cheat-sheet

```
POST  /api/onboarding/start                              → { user_id }
GET   /api/onboarding/:userId                            → { onboarding_step, ... }
PUT   /api/onboarding/:userId/step/1..7                  → ok
POST  /api/onboarding/:userId/parse-training-plan        → { parsed: { days[] } }
POST  /api/onboarding/:userId/consent                    → ok
GET   /api/food/search?q=X                               → FoodMatch[]
GET   /healthz                                           → { ok }
```
