// Adaptadores entre el estado local del onboarding (rico para UI) y los bodies
// estrictos que pide el backend. Centralizado acá para que las pantallas no
// conozcan los schemas del back.

import type {
  Consent, DietaryRestrictions, Goal, MealsData, MedicalHistory,
  NutritionPlan, TrainingDay, TrainingPlan, UserData,
} from "../onboarding/types";
import { serializeDistance } from "../pages/Step3Goal";
import type { ParsedTrainingPlan } from "./client";

const splitList = (s: string): string[] =>
  s.split(/[,\n;]+/g).map((x) => x.trim()).filter(Boolean);

/* ----------------- Step 1 ----------------- */

export function buildStep1Body(u: UserData) {
  return {
    name: u.fullName.trim(),
    email: u.email.trim(),
    age: u.age,
    sex: u.sex,
    weight_kg: u.weightKg,
    height_cm: u.heightCm,
    body_fat_pct: u.bodyFatPct ?? null,
    ...(u.phoneWa.trim() ? { phone_wa: u.phoneWa.trim() } : {}),
  };
}

/* ----------------- Step 2 -----------------
   La UI captura free-text. El back pide arrays estructurados.
   Convertimos best-effort. Si el usuario dejó algo en blanco → []. */

export function buildStep2Body(m: MedicalHistory) {
  const today = new Date().toISOString().slice(0, 10);

  const activeInjuries = m.activeInjuries.trim()
    ? [{
        description: m.activeInjuries.trim().slice(0, 500),
        location: "no especificada",
        pain_level: 0,
        start_date: today,
        in_treatment: false,
      }]
    : [];

  const pastInjuries = m.pastInjuries.trim()
    ? [{
        description: m.pastInjuries.trim().slice(0, 500),
        year: new Date().getFullYear(),
      }]
    : [];

  const medications = splitList(m.medication).map((name) => ({
    name,
    dose: null as string | null,
    schedule: null as string | null,
  }));

  return {
    active_injuries: activeInjuries,
    past_injuries: pastInjuries,
    chronic_conditions: splitList(m.chronicConditions),
    allergies: splitList(m.allergies),
    medications,
    // TODO: cuando haya storage para uploads, subir y mandar la URL acá.
    ecg_file_url: null,
    xray_file_url: null,
    blood_work_url: null,
    medical_clearance_url: null,
  };
}

/* ----------------- Step 3 -----------------
   El back acepta competition | recomp | performance. La UI tiene tipos por
   deporte (running, trail, etc.) — todos los casos del onboarding son
   competiciones con fecha, así que mapeamos a "competition". */

export function buildStep3Body(g: Goal) {
  const distance = serializeDistance(g.distance, g.competitionType);
  return {
    event_type: "competition" as const,
    event_name: g.eventName.trim(),
    event_date: g.eventDate,
    ...(distance ? { distance } : {}),
    ...(g.notes.trim() ? { objective_notes: g.notes.trim().slice(0, 500) } : {}),
  };
}

/* ----------------- Step 4 ----------------- */

export function buildStep4Body(n: NutritionPlan) {
  return {
    target_kcal: n.kcal!,
    target_protein_g: n.proteinG!,
    target_carbs_g: n.carbsG!,
    target_fat_g: n.fatG!,
    ...(n.nutritionistName.trim() ? { nutritionist_name: n.nutritionistName.trim() } : {}),
    // TODO: subir archivo a storage y mandar URL.
    plan_file_url: null,
  };
}

/* ----------------- Step 5 ----------------- */

export function buildStep5Body(d: DietaryRestrictions) {
  return {
    no_beef: false,
    no_chicken: false,
    no_pork: d.noPork,
    no_fish: d.noFish,
    no_dairy: d.noLactose,
    no_eggs: false,
    vegan: d.vegan,
    vegetarian: d.vegetarian,
    celiac: d.celiac,
    lactose_intolerant: d.noLactose,
    ...(d.custom.trim() ? { other: d.custom.trim().slice(0, 500) } : {}),
  };
}

/* ----------------- Step 6 -----------------
   Si el user pasó por el parser AI, usamos parsedDays. Si no, convertimos la
   semana del editor manual. */

const DAY_TO_NUM: Record<TrainingDay["day"], number> = {
  dom: 0, lun: 1, mar: 2, mie: 3, jue: 4, vie: 5, sab: 6,
};

const SESSION_TO_BACK: Record<TrainingDay["type"], string> = {
  rest: "descanso",
  run: "corrida",
  bike: "bici",
  swim: "natacion",
  strength: "gym",
  mobility: "movilidad",
  race: "corrida",
  other: "otro",
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function manualWeekToTrainingDays(week: TrainingDay[]) {
  return week.map((d) => ({
    day_of_week: DAY_TO_NUM[d.day],
    session_type: SESSION_TO_BACK[d.type],
    session_name: d.description.trim() || null,
    ...(d.time && TIME_RE.test(d.time) ? { approx_time: d.time } : {}),
    ...(d.durationMin ? { duration_min: d.durationMin } : {}),
    exercises: [] as ParsedTrainingPlan["days"][number]["exercises"],
  }));
}

export function buildStep6Body(t: TrainingPlan, parsed: ParsedTrainingPlan | null) {
  const training_days = parsed
    ? parsed.days.map((d) => ({
        day_of_week: d.day_of_week,
        session_type: d.session_type,
        ...(d.session_name ? { session_name: d.session_name } : {}),
        ...(d.duration_min ? { duration_min: d.duration_min } : {}),
        exercises: d.exercises,
      }))
    : manualWeekToTrainingDays(t.week.filter((d) => d.type !== "rest" || t.week.length === 1));

  return {
    ...(t.coachName.trim() ? { coach_name: t.coachName.trim() } : {}),
    training_days,
  };
}

/* ----------------- Step 7 -----------------
   La UI no captura macros por ingrediente. Mandamos 0s — el bot ya pedirá
   completar macros desde WhatsApp si hace falta. */

export function buildStep7Body(m: MealsData) {
  const meals = m.meals
    .filter((meal) => meal.alias.trim() && meal.ingredients.some((i) => i.name.trim()))
    .map((meal) => ({
      alias: meal.alias.trim().slice(0, 100),
      ingredients: meal.ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({
          food_item_id: null,
          name: i.name.trim(),
          grams: i.grams ?? 0,
          kcal: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
        })),
      total_kcal: 0,
      total_protein_g: 0,
      total_carbs_g: 0,
      total_fat_g: 0,
    }));
  return { meals };
}

/* ----------------- Consent ----------------- */

export function buildConsentBody(c: Consent) {
  return {
    data_processing: c.sensitiveData as true,
    international_transfer: c.internationalTransfer as true,
    nutrition_disclaimer: c.nutritionDisclaimer as true,
  };
}
