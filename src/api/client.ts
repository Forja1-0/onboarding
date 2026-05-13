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
