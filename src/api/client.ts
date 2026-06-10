// Cliente HTTP del onboarding. Sigue el shape documentado en API_QUICKREF.md.
// - unwrap: normaliza el formato de errores del backend (validation_error / errores de negocio).
// - ApiError / ValidationError: para que las pantallas reaccionen distinto a cada caso.

const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
const BASE = env.VITE_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super("validation_error");
    this.name = "ValidationError";
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T;
  const body = await res.json().catch(() => ({ error: "unknown_error" }));

  if (body.error === "validation_error") {
    const fieldErrors: Record<string, string> = {};
    for (const issue of body.issues ?? []) {
      const key = issue.path?.join(".") ?? "_root";
      fieldErrors[key] = issue.message;
    }
    throw new ValidationError(fieldErrors);
  }
  // Errores de negocio que apuntan a un campo (ej. email ya registrado, 409):
  // los tratamos como ValidationError para resaltar el input en vez de mostrar
  // un cartel genérico.
  const field = (body.details as { field?: string } | undefined)?.field;
  if (field && typeof body.error === "string") {
    throw new ValidationError({ [field]: body.error });
  }
  throw new ApiError(res.status, body.error ?? "unknown_error", body.details);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  return unwrap<T>(res);
}

// Upload multipart: NO seteamos Content-Type (el browser pone el boundary).
async function uploadFile<T>(path: string, file: File): Promise<T> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}${path}`, { method: "POST", body: fd });
  return unwrap<T>(res);
}

/* ----------------- Tipos compartidos con el backend ----------------- */

export type OnboardingState = {
  user_id: string;
  name: string | null;
  email: string | null;
  phone_wa: string | null;
  onboarding_step: number;
  active: boolean;
};

export type StartResponse = {
  user_id: string;
  onboarding_step: number;
  active: boolean;
};

export type StepResponse = {
  ok: true;
  step: number;
  result: unknown;
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

// JSON rico devuelto por POST /nutrition-plan/upload
export type ParsedNutritionPlanRich = {
  athlete_summary: { name: string | null; age: number | null; weight_kg: number | null; height_cm: number | null; goal: string | null };
  targets: { kcal: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null };
  nutritionist_name: string | null;
  phase: string | null;
  meal_distribution: Array<{
    meal_id: string;
    label: string;
    schedule: string | null;
    description: string | null;
    items: Array<{ name: string; grams: number | null; units: string | null }>;
    macros: { kcal: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null };
    notes: string | null;
  }>;
  daily_variants: Array<{ when: string; adjustments: string }>;
  timing_rules: Array<{ nutrient: string; window: string; rationale: string; foods: string[] }>;
  meal_prep: Array<{ item: string; quantity: string; method: string; keeps_for: string | null }>;
  shopping_list: Array<{ item: string; weekly_qty: string; price_estimate: string | null; key_contribution: string | null }>;
  hydration: { daily_l_min: number | null; daily_l_double_session: number | null; electrolyte_recipe: string | null; notes: string | null };
  success_indicators: string[];
  general_notes: string[];
};

// JSON rico devuelto por POST /training-plan/upload
export type ParsedTrainingPlanRich = {
  athlete_summary: { name: string | null; age: number | null; weight_kg: number | null; height_cm: number | null; active_injuries: string[] };
  event: { name: string | null; date: string | null; distance: string | null };
  period: { label: string | null; weeks: number | null };
  coach_name: string | null;
  weekly_structure: {
    normal: Array<{ day: string; day_of_week: number; sessions: Array<{ kind: string; label: string; time: string | null; duration_min: number | null }> }>;
    reduced: Array<{ day: string; day_of_week: number; sessions: Array<{ kind: string; label: string; time: string | null; duration_min: number | null }> }>;
  };
  rehab_rules: string[];
  days: Array<{
    day_of_week: number;
    session_type: string;
    session_name: string | null;
    duration_min: number | null;
    approx_time: string | null;
    rationale: string | null;
    exercises: Array<{
      name: string;
      aliases: string[];
      sets: number | null;
      reps: string | null;
      load_kg: number | null;
      rest: string | null;
      tempo: string | null;
      notes: string | null;
      is_rehab: boolean;
    }>;
    volume_total_sets: number | null;
  }>;
  rehab_protocols: Array<{ area: string; status: string | null; current_phase: string | null; exercises_summary: string; progression_criteria: string[]; contraindications: string[]; citations: string[] }>;
  swim_plan: { sessions: Array<{ label: string; structure: string; total_volume_m: number | null; focus: string | null }>; progression: Array<{ weeks: string; volume_m: string; focus: string }>; notes: string | null } | null;
  progression_model: { description: string; steps: string[] } | null;
  alerts: { stop_signals: string[]; reduce_signals: string[] };
  general_notes: string[];
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

/* ----------------- Endpoints ----------------- */

export const api = {
  startOnboarding: (body: { email?: string; phone_wa?: string }) =>
    request<StartResponse>("/api/onboarding/start", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getOnboarding: (userId: string) =>
    request<OnboardingState>(`/api/onboarding/${userId}`),

  saveStep: <T = unknown>(userId: string, step: number, body: T) =>
    request<StepResponse>(`/api/onboarding/${userId}/step/${step}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  parseTrainingPlan: (userId: string, text: string) =>
    request<{ ok: true; parsed: ParsedTrainingPlan }>(
      `/api/onboarding/${userId}/parse-training-plan`,
      { method: "POST", body: JSON.stringify({ text }) },
    ),

  uploadNutritionPlan: (userId: string, file: File) =>
    uploadFile<{ ok: true; id: string; parsed: ParsedNutritionPlanRich }>(
      `/api/onboarding/${userId}/nutrition-plan/upload`,
      file,
    ),

  uploadTrainingPlan: (userId: string, file: File) =>
    uploadFile<{ ok: true; id: string; parsed: ParsedTrainingPlanRich }>(
      `/api/onboarding/${userId}/training-plan/upload`,
      file,
    ),

  saveConsent: (
    userId: string,
    body: {
      data_processing: true;
      international_transfer: true;
      nutrition_disclaimer: true;
    },
  ) =>
    request<{ ok: true; consented_at: string }>(
      `/api/onboarding/${userId}/consent`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  searchFood: (q: string, limit = 10) =>
    request<FoodMatch[]>(
      `/api/food/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    ),

  healthCheck: () => request<{ ok: true; ts: string }>("/healthz"),
};
