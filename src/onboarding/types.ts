// Tipos del onboarding. Mantienen un shape rico para el UI.
// Al guardar al backend, los transformers (api/onboarding.ts) los serializan
// al schema documentado en ONBOARDING.md.

export type Sex = "M" | "F" | "X";

export interface UserData {
  fullName: string;
  age: number | null;
  sex: Sex | null;
  weightKg: number | null;
  heightCm: number | null;
  bodyFatPct: number | null;
  email: string;
  phoneWa: string;
}

export interface MedicalHistory {
  activeInjuries: string;
  pastInjuries: string;
  chronicConditions: string;
  allergies: string;
  medication: string;
  uploads: { name: string; size: number }[];
}

/* --------- Goal: distancia dinámica por tipo de competencia --------- */

export type CompetitionType =
  | "running"
  | "trail"
  | "triathlon"
  | "cycling"
  | "swimming"
  | "strength"
  | "team"
  | "other";

export type TriPreset = "sprint" | "olimpico" | "half" | "ironman" | "custom";

export interface CustomDistance {
  id: string;
  label: string;          // "Trote", "Bici", "Natación"...
  value: number | null;   // numérico
  unit: "km" | "m";
}

export interface DistanceData {
  // Single (running, trail, cycling, swimming)
  single?: { value: number | null; unit: "km" | "m" };
  // Triatlón: presets + override custom
  tri?: {
    preset: TriPreset;
    swimM: number | null;
    bikeKm: number | null;
    runKm: number | null;
  };
  // Otro: lista de distancias por disciplina
  custom?: CustomDistance[];
}

export interface Goal {
  competitionType: CompetitionType | null;
  eventName: string;
  eventDate: string; // ISO yyyy-mm-dd
  distance: DistanceData;
  notes: string;
}

/* ----- Nutrition (incluye archivo del nutricionista, ya que el backend
   lo mapea a nutrition_plans.plan_file_url + nutritionist_name) ----- */

export interface NutritionPlan {
  kcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  perMealDistribution: boolean;
  nutritionistName: string;
  planFile: { name: string; size: number } | null;
}

export interface DietaryRestrictions {
  vegan: boolean;
  vegetarian: boolean;
  celiac: boolean;
  noLactose: boolean;
  noPork: boolean;
  noFish: boolean;
  custom: string;
}

/* --------- Training: upload-first + manual fallback --------- */

export type SessionType =
  | "rest" | "run" | "bike" | "swim" | "strength" | "mobility" | "race" | "other";

export interface TrainingDay {
  day: "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";
  type: SessionType;
  time: string;            // HH:mm
  durationMin: number | null;
  description: string;
}

export interface ParsedTrainingDay {
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
}

export interface TrainingPlan {
  // Modo: si hay archivo o texto pegado, es la fuente de verdad.
  // El editor manual es fallback explícito.
  coachName: string;
  planFile: { name: string; size: number } | null;
  planText: string;        // texto pegado (WA, copy-paste de Excel/Sheet…)
  parsed: boolean;         // true si pasó por /parse-training-plan
  parsedDays: ParsedTrainingDay[] | null; // resultado del parser AI
  // Editor manual (semana tipo) — convive con archivo, pero el usuario sabe
  // que el archivo es la verdad y esto es preview/ajuste.
  week: TrainingDay[];
}

/* --------- Frequent meals: upload-first + manual fallback --------- */

export interface FrequentMeal {
  id: string;
  alias: string;           // etiqueta del USER ("Desayuno 1", "Pre-entreno"…)
  ingredients: { name: string; grams: number | null }[];
  notes: string;
}

export interface MealsData {
  // Si el nutri dio un plan con listado de comidas, el user lo sube acá.
  listFile: { name: string; size: number } | null;
  listText: string;
  // Manual: comidas que el user repite en su semana.
  meals: FrequentMeal[];
}

export interface Consent {
  sensitiveData: boolean;
  internationalTransfer: boolean;
  nutritionDisclaimer: boolean;
}

export interface OnboardingState {
  userId: string | null;
  user: UserData;
  medical: MedicalHistory;
  goal: Goal;
  nutrition: NutritionPlan;
  diet: DietaryRestrictions;
  training: TrainingPlan;
  meals: MealsData;
  consent: Consent;
  completedSteps: number[]; // índices 1..8
}

export const ONBOARDING_STEPS = [
  { idx: 1, slug: "datos-personales",    title: "Datos personales",      eyebrow: "Paso 1 · 2 min",  table: "users" },
  { idx: 2, slug: "historia-clinica",    title: "Historia clínica",      eyebrow: "Paso 2 · 2 min",  table: "medical_history" },
  { idx: 3, slug: "objetivo",            title: "Objetivo deportivo",    eyebrow: "Paso 3 · 1 min",  table: "goals" },
  { idx: 4, slug: "plan-nutricional",    title: "Plan nutricional",      eyebrow: "Paso 4 · 1 min",  table: "nutrition_plans" },
  { idx: 5, slug: "restricciones",       title: "Restricciones",         eyebrow: "Paso 5 · 30 s",   table: "dietary_restrictions" },
  { idx: 6, slug: "entrenamiento",       title: "Plan de entrenamiento", eyebrow: "Paso 6 · 3 min",  table: "training_plans" },
  { idx: 7, slug: "comidas-frecuentes",  title: "Comidas frecuentes",    eyebrow: "Paso 7 · 3 min",  table: "frequent_meals" },
  { idx: 8, slug: "consentimiento",      title: "Consentimiento",        eyebrow: "Paso 8 · 30 s",   table: "consent" },
] as const;

/* --------- Triatlón presets oficiales --------- */
export const TRI_PRESETS: Record<Exclude<TriPreset, "custom">, { swimM: number; bikeKm: number; runKm: number; label: string }> = {
  sprint:   { swimM: 750,  bikeKm: 20,  runKm: 5,    label: "Sprint" },
  olimpico: { swimM: 1500, bikeKm: 40,  runKm: 10,   label: "Olímpico" },
  half:     { swimM: 1900, bikeKm: 90,  runKm: 21.1, label: "Half · 70.3" },
  ironman:  { swimM: 3800, bikeKm: 180, runKm: 42.2, label: "Ironman" },
};
