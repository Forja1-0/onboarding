# Onboarding — Documentación para Frontend

Guía completa de cómo el frontend tiene que consumir los endpoints de onboarding. Cubre los 7 pasos + consentimiento + parser AI del plan de entrenamiento.

**Base URL:** `${API_URL}/api/onboarding`

**Sin autenticación.** El `userId` se obtiene en `/start` y se mantiene en el cliente durante todo el flow (sessionStorage / cookie). Es lo único que identifica al user hasta que vincule WhatsApp.

---

## Flow general

```
1. POST /start                              → recibís userId, lo guardás
2. PUT /:userId/step/1                      → datos personales
3. PUT /:userId/step/2                      → historia clínica
4. PUT /:userId/step/3                      → objetivo deportivo
5. PUT /:userId/step/4                      → plan nutricional
6. PUT /:userId/step/5                      → restricciones alimentarias
7. POST /:userId/parse-training-plan        → (opcional) parseo AI del plan
   PUT /:userId/step/6                      → plan de entrenamiento
8. PUT /:userId/step/7                      → comidas frecuentes
9. POST /:userId/consent                    → consentimiento legal final
```

El backend tracea `onboarding_step` en `users` (0–7). Cada PUT lo bumpea con `GREATEST(onboarding_step, n)`, así que podés reintentar pasos sin perder progreso.

Para reanudar un onboarding interrumpido: `GET /:userId` te dice en qué paso está.

---

## Endpoints

### 1. Crear user shell

```
POST /api/onboarding/start
```

**Body** (todos opcionales — solo para evitar dobles registros):
```json
{
  "email": "atleta@forja.app",
  "phone_wa": "5491145678901"
}
```

**Response 201:**
```json
{
  "user_id": "9a1b...uuid",
  "onboarding_step": 0,
  "active": true
}
```

> **Guardá `user_id`** en sessionStorage. Lo necesitás en todas las llamadas siguientes.

---

### 2. Obtener estado actual del onboarding

```
GET /api/onboarding/:userId
```

**Response 200:**
```json
{
  "user_id": "9a1b...",
  "name": "Pedro Reverendo",
  "email": "p@forja.app",
  "phone_wa": "5491145678901",
  "onboarding_step": 4,
  "active": true
}
```

Útil para retomar onboarding desde donde quedó.

---

### 3. Guardar paso N

```
PUT /api/onboarding/:userId/step/:n
```

`n` va de 1 a 7. Body varía según el paso (ver abajo).

**Response 200 (todos los steps):**
```json
{ "ok": true, "step": N, "result": { ... } }
```

**Errores comunes:**
- `400` — payload inválido (Zod te tira el detalle en `error`).
- `404` — userId no existe.

---

### Paso 1 — Datos personales → tabla `users`

```
PUT /api/onboarding/:userId/step/1
```

```json
{
  "name": "Pedro Reverendo",      // string, 2-100 chars
  "email": "p@forja.app",          // valid email, max 200
  "age": 28,                       // int, 16-70
  "sex": "M",                      // "M" | "F" | "X"
  "weight_kg": 78.5,               // 30-200
  "height_cm": 178,                // 120-230
  "body_fat_pct": 14.5,            // OPCIONAL, 1-60, null permitido
  "phone_wa": "5491145678901"      // OPCIONAL, 8-20 chars
}
```

Se usa para calcular TMB (Mifflin-St Jeor) internamente.

---

### Paso 2 — Historia clínica → tabla `medical_history`

```
PUT /api/onboarding/:userId/step/2
```

```json
{
  "active_injuries": [
    {
      "description": "Tendinitis rotuliana derecha",
      "location": "rodilla derecha",
      "pain_level": 4,                     // 0-10
      "start_date": "2026-03-15",          // YYYY-MM-DD
      "in_treatment": true
    }
  ],
  "past_injuries": [
    {
      "description": "Esguince tobillo izq",
      "type": "esguince grado 2",          // OPCIONAL
      "year": 2023                          // 1950 - current year
    }
  ],
  "chronic_conditions": ["asma", "hipotiroidismo"],   // array de strings
  "allergies": ["maní", "mariscos"],
  "medications": [
    { "name": "Levotiroxina", "dose": "50mcg", "schedule": "1/día mañana" }
  ],

  // Archivos médicos OPCIONALES — el frontend sube a su storage
  // (S3/Cloudinary) y manda solo la URL pública o firmada
  "ecg_file_url": "https://cdn.forja.app/u/abc/ecg.pdf",
  "xray_file_url": null,
  "blood_work_url": "https://cdn.forja.app/u/abc/blood.pdf",
  "medical_clearance_url": null
}
```

**Límites:** max 10 lesiones activas, max 10 pasadas, max 20 condiciones, max 20 alergias, max 20 medicaciones.

Para entradas vacías mandá `[]`, **no** omitas la key.

---

### Paso 3 — Objetivo deportivo → tabla `goals`

```
PUT /api/onboarding/:userId/step/3
```

```json
{
  "event_type": "competition",   // "competition" | "recomp" | "performance"
  "event_name": "Maratón BA",    // REQUERIDO si event_type=competition; null en los otros
  "event_date": "2026-09-22",    // YYYY-MM-DD
  "distance": "42K",             // OPCIONAL, ej: "21K", "Sprint", "Half"
  "objective_notes": "Sub 3:30"  // OPCIONAL, max 500 chars
}
```

Marca cualquier `goals` previo del user como `is_active=false` antes de crear el nuevo.

---

### Paso 4 — Plan nutricional → tabla `nutrition_plans`

```
PUT /api/onboarding/:userId/step/4
```

```json
{
  "target_kcal": 2800,           // int, 800-8000
  "target_protein_g": 180,       // int, ≥0
  "target_carbs_g": 320,         // int, ≥0
  "target_fat_g": 90,            // int, ≥0

  // OPCIONAL — distribución sugerida por comida (JSON libre)
  "meal_distribution": {
    "desayuno":   { "kcal": 600, "protein": 35 },
    "almuerzo":   { "kcal": 800, "protein": 50 },
    "merienda":   { "kcal": 400, "protein": 25 },
    "cena":       { "kcal": 700, "protein": 45 },
    "snack":      { "kcal": 300, "protein": 25 }
  },

  "nutritionist_name": "Lic. Juan Pérez",                 // OPCIONAL
  "plan_file_url": "https://cdn.forja.app/u/abc/plan.pdf" // OPCIONAL
}
```

> **Filtro crítico ICP**: si el atleta no tiene macros definidos por nutri, no puede usar la app. El frontend debería tener un fallback amable ("¿no tenés macros? te recomendamos un nutri").

---

### Paso 5 — Restricciones alimentarias → tabla `dietary_restrictions`

```
PUT /api/onboarding/:userId/step/5
```

```json
{
  "no_beef": false,
  "no_chicken": false,
  "no_pork": true,
  "no_fish": false,
  "no_dairy": false,
  "no_eggs": false,
  "vegan": false,
  "vegetarian": false,
  "celiac": false,
  "lactose_intolerant": true,
  "other": "evito alimentos ultraprocesados"   // OPCIONAL, free text 0-500
}
```

Todos los booleanos default `false` — podés omitir las que sean falsas.

---

### Paso 6 — Plan de entrenamiento → tabla `training_plans`

```
PUT /api/onboarding/:userId/step/6
```

```json
{
  "coach_name": "Marcos Roberto",            // OPCIONAL
  "training_days": [
    {
      "day_of_week": 1,                       // 0=domingo, 1=lunes ... 6=sábado
      "session_type": "gym",                  // gym|natacion|bici|corrida|funcional|crossfit|yoga|movilidad|descanso|otro
      "session_name": "Piernas A",            // OPCIONAL
      "approx_time": "07:30",                 // OPCIONAL, "HH:MM" o "HH:MM:SS"
      "duration_min": 75,                     // OPCIONAL, 1-480
      "exercises": [                          // OPCIONAL — habilita matching avanzado
        {
          "name": "Sentadilla",
          "aliases": ["sentadillas", "back squat", "squat"],
          "sets": 4,
          "reps": "8-10",
          "load_kg": null,
          "notes": null
        }
      ]
    },
    {
      "day_of_week": 3,
      "session_type": "gym",
      "session_name": "Empuje",
      "exercises": [ /* ... */ ]
    },
    { "day_of_week": 0, "session_type": "descanso", "exercises": [] }
  ]
}
```

**Reglas:**
- `training_days`: min 1, max 14 (permite "Lunes A" y "Lunes B" en semanas alternadas).
- `exercises`: nullable. Si no lo mandás, el bot del WhatsApp matchea solo a nivel sesión (menos preciso).
- Días de descanso: `session_type: "descanso"`, `exercises: []`.
- Si guardás un plan nuevo, el viejo se marca `is_active=false`.

---

### Paso 6 BIS — Parser AI del plan (OPCIONAL pero recomendado)

Si el coach le pasó el plan como texto/Excel/lo que sea, el user lo pega en un textarea grande y este endpoint lo estructura con Gemini.

```
POST /api/onboarding/:userId/parse-training-plan
```

```json
{
  "text": "Lunes\nPiernas A\nSentadilla 4x8\nPrensa 3x12\nHack 3x10\n\nMiercoles\nEmpuje\nPress banca 4x8..."
}
```

**Response 200:**
```json
{
  "ok": true,
  "parsed": {
    "coach_name": null,
    "days": [
      {
        "day_of_week": 1,
        "session_type": "gym",
        "session_name": "Piernas A",
        "duration_min": null,
        "exercises": [
          {
            "name": "Sentadilla",
            "aliases": ["sentadillas", "back squat", "squat"],
            "sets": 4,
            "reps": "8",
            "load_kg": null,
            "notes": null
          }
        ]
      }
    ]
  }
}
```

**Errores:**
- `400` — texto vacío, demasiado corto (<10 chars), o Gemini no pudo interpretarlo.

**UX recomendada:** mostrar el `parsed` como preview editable. El user revisa/corrige y después manda el resultado final a `PUT /step/6`. **Limita el textarea a 8000 chars** (el backend trunca a eso).

**Costo:** 1 llamada a Gemini por user en toda su vida útil. Económico.

---

### Paso 7 — Comidas frecuentes → tabla `frequent_meals`

```
PUT /api/onboarding/:userId/step/7
```

```json
{
  "meals": [
    {
      "alias": "desayuno 1",                  // 1-100 chars, único por user
      "ingredients": [
        {
          "food_item_id": "uuid-del-food-en-SARA",  // OPCIONAL (null si no matchea)
          "name": "Huevo",
          "grams": 180,
          "kcal": 286,
          "protein_g": 24,
          "carbs_g": 2,
          "fat_g": 20
        },
        {
          "food_item_id": "uuid-pan-integral",
          "name": "Pan integral",
          "grams": 60,
          "kcal": 150,
          "protein_g": 6,
          "carbs_g": 26,
          "fat_g": 2
        }
      ],
      "total_kcal": 436,                      // int, ≥0
      "total_protein_g": 30,                  // ≥0
      "total_carbs_g": 28,                    // ≥0
      "total_fat_g": 22                       // ≥0
    }
  ]
}
```

**Reglas:**
- `meals`: min 1, max 30.
- `ingredients`: min 1, max 20 por comida.
- El frontend tiene que **sumar los totals** y mandarlos — el backend los persiste tal cual (no recalcula).
- `food_item_id`: usa el endpoint de búsqueda de comidas (sección abajo) para enlazar a SARA cuando matchee. Si no, mandá `null` y el frontend muestra solo macros.

> **Inversión inicial**: el user gasta 10-15 min armando 5-10 comidas habituales. Después en WhatsApp dice "desayuno 1" y se loguea en 1 segundo.

---

### 4. Búsqueda de alimentos (helper para step 7)

```
GET /api/food/search?q=pollo&limit=10
```

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Pollo, pechuga, sin piel, cocido",
    "category": "proteina_animal",
    "kcal_per_100g": 165,
    "protein_per_100g": 31,
    "carbs_per_100g": 0,
    "fat_per_100g": 3.6,
    "fiber_per_100g": 0,
    "standard_portion_g": 150,
    "source": "SARA2",
    "match_score": 1.0,
    "match_source": "prefix"
  }
]
```

Cascada de matching: prefix (score=1) > FTS español > trigram. Usalo para autocomplete del armado de comidas frecuentes.

---

### 5. Consentimiento → tabla `consents`

**Obligatorio Ley 25.326.** Bloqueante para activar la cuenta.

```
POST /api/onboarding/:userId/consent
```

```json
{
  "data_processing": true,           // tiene que ser true literal
  "international_transfer": true,    // tiene que ser true literal
  "nutrition_disclaimer": true       // tiene que ser true literal
}
```

Si mandás `false` en cualquiera → 400 con mensaje claro.

**Response 200:**
```json
{ "ok": true, "consented_at": "2026-05-13T01:30:00Z" }
```

El backend captura la IP (X-Forwarded-For o socket) y el User-Agent automáticamente.

---

## Vinculación de WhatsApp (post-onboarding)

El campo `wa_chat_id` se llena del lado del bot la primera vez que el user manda un mensaje al número de Forja. **No es parte del flow web.**

UX sugerida al final del onboarding:
> "Mandanos *hola* a este número de WhatsApp: [click to chat link]"

Una vez que el user manda el primer mensaje, el bot busca por `phone_wa` (del step 1), enlaza `wa_chat_id`, y queda todo conectado.

---

## Resumen de validaciones críticas

| Step | Campo | Validación |
|------|-------|------------|
| 1 | age | 16-70 |
| 1 | weight_kg | 30-200 |
| 1 | height_cm | 120-230 |
| 1 | sex | M/F/X |
| 2 | pain_level | 0-10 |
| 3 | event_type=competition | requiere event_name |
| 4 | target_kcal | 800-8000 |
| 6 | day_of_week | 0-6 |
| 6 | duration_min | 1-480 |
| 7 | grams | 1-5000 |
| Consent | todos los flags | true literal (false → 400) |

---

## Errores y reintentos

- **Idempotencia**: los PUTs de steps usan `ON CONFLICT DO UPDATE` o `UPDATE … is_active=false + INSERT` en transacción. Reenviar el mismo step es seguro.
- **400**: el body es un objeto Zod issue. Map de errores por campo:
  ```json
  { "error": { "name": "ZodError", "issues": [{ "path": ["age"], "message": "..." }] } }
  ```
- **404**: el userId no existe o expiró. Volvé a `/start`.
- **500**: errores del server (Gemini caído, DB caída, etc). Reintento exponencial razonable.

---

## Estado de la base de datos

Las tablas tocadas por el onboarding (en orden de paso):

| Step | Tabla | Operación |
|------|-------|-----------|
| 0 (/start) | `users` | INSERT shell |
| 1 | `users` | UPDATE datos personales |
| 2 | `medical_history` | UPSERT (1 fila por user) |
| 3 | `goals` | INSERT (marca anteriores `is_active=false`) |
| 4 | `nutrition_plans` | INSERT (marca anteriores `is_active=false`) |
| 5 | `dietary_restrictions` | UPSERT (1 fila por user) |
| 6 | `training_plans` | DELETE soft (`is_active=false`) + INSERT N días |
| 7 | `frequent_meals` | DELETE hard + INSERT N comidas |
| Final | `consents` | UPSERT (1 fila por user) |

**Migraciones requeridas** (en orden):
1. `sql/schema.sql` — base completa
2. `sql/migrations/001_user_shell.sql` — permite users sin datos para el flow
3. `sql/migrations/002_training_exercises.sql` — agrega `exercises JSONB` a `training_plans`

---

## TL;DR para implementar

1. Pantalla 0 (landing): boton "Empezar" → POST `/start` → guardar `user_id`.
2. Pantallas 1-7: una por paso, cada submit hace `PUT /step/N` con el body validado en el cliente (Zod o yup).
3. Pantalla 6: ofrecer textarea "pegá tu plan" + botón "Parsear" que llama `parse-training-plan` → preview editable → enviar a `step/6`.
4. Pantalla final: 3 checkboxes obligatorios + botón "Confirmar" → POST `/consent`.
5. Después: pantalla con instrucciones para escribir al WhatsApp del bot.
