import { describe, expect, it } from "vitest";
import {
  buildConsentBody,
  buildStep1Body,
  buildStep2Body,
  buildStep3Body,
  buildStep4Body,
  buildStep5Body,
  buildStep6Body,
  buildStep7Body,
} from "../transformers";
import type {
  Consent, DietaryRestrictions, Goal, MealsData,
  MedicalHistory, NutritionPlan, TrainingPlan, UserData,
} from "../../onboarding/types";

const baseUser: UserData = {
  fullName: "Pedro Reverendo",
  age: 28,
  sex: "M",
  weightKg: 78.5,
  heightCm: 178,
  bodyFatPct: 14.5,
  email: "p@forja.app",
  phoneWa: "5491145678901",
};

/* ============ Step 1 ============ */
describe("buildStep1Body", () => {
  it("mapea los campos al snake_case del back", () => {
    const body = buildStep1Body(baseUser);
    expect(body).toMatchObject({
      name: "Pedro Reverendo",
      email: "p@forja.app",
      age: 28,
      sex: "M",
      weight_kg: 78.5,
      height_cm: 178,
      body_fat_pct: 14.5,
      phone_wa: "5491145678901",
    });
  });

  it("omite phone_wa si está vacío", () => {
    const body = buildStep1Body({ ...baseUser, phoneWa: "" });
    expect(body).not.toHaveProperty("phone_wa");
  });

  it("nullea body_fat_pct si no se cargó", () => {
    const body = buildStep1Body({ ...baseUser, bodyFatPct: null });
    expect(body.body_fat_pct).toBeNull();
  });

  it("trimea name y email", () => {
    const body = buildStep1Body({ ...baseUser, fullName: "  Pedro  ", email: "  p@x.com  " });
    expect(body.name).toBe("Pedro");
    expect(body.email).toBe("p@x.com");
  });
});

/* ============ Step 2 ============ */
describe("buildStep2Body", () => {
  const baseMed: MedicalHistory = {
    activeInjuries: "", pastInjuries: "", chronicConditions: "",
    allergies: "", medication: "", uploads: [],
  };

  it("manda arrays vacíos cuando todo está en blanco", () => {
    const body = buildStep2Body(baseMed);
    expect(body.active_injuries).toEqual([]);
    expect(body.past_injuries).toEqual([]);
    expect(body.chronic_conditions).toEqual([]);
    expect(body.allergies).toEqual([]);
    expect(body.medications).toEqual([]);
  });

  it("manda archivos como null", () => {
    const body = buildStep2Body(baseMed);
    expect(body.ecg_file_url).toBeNull();
    expect(body.xray_file_url).toBeNull();
    expect(body.blood_work_url).toBeNull();
    expect(body.medical_clearance_url).toBeNull();
  });

  it("convierte free-text de active_injuries en un item estructurado válido", () => {
    const body = buildStep2Body({ ...baseMed, activeInjuries: "Tendinitis rotuliana derecha" });
    expect(body.active_injuries).toHaveLength(1);
    const inj = body.active_injuries[0];
    expect(inj.description).toBe("Tendinitis rotuliana derecha");
    expect(inj.pain_level).toBeGreaterThanOrEqual(0);
    expect(inj.pain_level).toBeLessThanOrEqual(10);
    expect(inj.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof inj.in_treatment).toBe("boolean");
  });

  it("convierte past_injuries con año actual", () => {
    const body = buildStep2Body({ ...baseMed, pastInjuries: "Esguince 2023" });
    expect(body.past_injuries[0].year).toBe(new Date().getFullYear());
  });

  it("splitea chronic_conditions por coma", () => {
    const body = buildStep2Body({ ...baseMed, chronicConditions: "asma, hipotiroidismo,diabetes" });
    expect(body.chronic_conditions).toEqual(["asma", "hipotiroidismo", "diabetes"]);
  });

  it("splitea alergias y filtra strings vacíos", () => {
    const body = buildStep2Body({ ...baseMed, allergies: "maní,  , mariscos" });
    expect(body.allergies).toEqual(["maní", "mariscos"]);
  });

  it("convierte medicación a objetos { name, dose, schedule }", () => {
    const body = buildStep2Body({ ...baseMed, medication: "Levotiroxina, Ibuprofeno" });
    expect(body.medications).toEqual([
      { name: "Levotiroxina", dose: null, schedule: null },
      { name: "Ibuprofeno", dose: null, schedule: null },
    ]);
  });
});

/* ============ Step 3 ============ */
describe("buildStep3Body", () => {
  const baseGoal: Goal = {
    competitionType: "running",
    eventName: "Maratón BA",
    eventDate: "2026-09-22",
    distance: { single: { value: 42.2, unit: "km" } },
    notes: "Sub 3:30",
  };

  it("mapea siempre a event_type 'competition'", () => {
    const body = buildStep3Body(baseGoal);
    expect(body.event_type).toBe("competition");
  });

  it("serializa la distance como string", () => {
    const body = buildStep3Body(baseGoal);
    expect(typeof body.distance).toBe("string");
    expect(body.distance).toContain("42.2");
  });

  it("manda event_date YYYY-MM-DD", () => {
    const body = buildStep3Body(baseGoal);
    expect(body.event_date).toBe("2026-09-22");
  });

  it("omite objective_notes si están vacías", () => {
    const body = buildStep3Body({ ...baseGoal, notes: "   " });
    expect(body).not.toHaveProperty("objective_notes");
  });

  it("omite distance si el tipo no la requiere (strength/team)", () => {
    const body = buildStep3Body({ ...baseGoal, competitionType: "strength", distance: {} });
    expect(body).not.toHaveProperty("distance");
  });
});

/* ============ Step 4 ============ */
describe("buildStep4Body", () => {
  const baseNut: NutritionPlan = {
    kcal: 2800, proteinG: 180, carbsG: 320, fatG: 90,
    perMealDistribution: false, nutritionistName: "Lic. Juan Pérez",
    planFile: null,
    parsedFromFile: false, parsedMeals: [], parsedNotes: [],
  };

  it("mapea macros al schema del back", () => {
    const body = buildStep4Body(baseNut);
    expect(body).toMatchObject({
      target_kcal: 2800,
      target_protein_g: 180,
      target_carbs_g: 320,
      target_fat_g: 90,
      nutritionist_name: "Lic. Juan Pérez",
      plan_file_url: null,
    });
  });

  it("omite nutritionist_name si está vacío", () => {
    const body = buildStep4Body({ ...baseNut, nutritionistName: "" });
    expect(body).not.toHaveProperty("nutritionist_name");
  });
});

/* ============ Step 5 ============ */
describe("buildStep5Body", () => {
  const baseDiet: DietaryRestrictions = {
    vegan: false, vegetarian: false, celiac: false,
    noLactose: false, noPork: false, noFish: false, custom: "",
  };

  it("default: todos los flags en false, no_beef/no_chicken/no_eggs siempre false", () => {
    const body = buildStep5Body(baseDiet);
    expect(body).toMatchObject({
      no_beef: false, no_chicken: false, no_pork: false, no_fish: false,
      no_dairy: false, no_eggs: false, vegan: false, vegetarian: false,
      celiac: false, lactose_intolerant: false,
    });
    expect(body).not.toHaveProperty("other");
  });

  it("noLactose mapea a no_dairy + lactose_intolerant", () => {
    const body = buildStep5Body({ ...baseDiet, noLactose: true });
    expect(body.no_dairy).toBe(true);
    expect(body.lactose_intolerant).toBe(true);
  });

  it("incluye other si el custom tiene texto", () => {
    const body = buildStep5Body({ ...baseDiet, custom: "evito ultraprocesados" });
    expect(body.other).toBe("evito ultraprocesados");
  });
});

/* ============ Step 6 ============ */
describe("buildStep6Body", () => {
  const baseTraining: TrainingPlan = {
    coachName: "Marcos",
    planFile: null,
    planText: "",
    parsed: false,
    parsedDays: null,
    parsedFromFile: false,
    parsedRehabRules: [],
    parsedRehabProtocols: [],
    parsedAlerts: { stop: [], reduce: [] },
    week: [
      { day: "lun", type: "strength", time: "07:30", durationMin: 75, description: "Piernas A" },
      { day: "mar", type: "rest", time: "", durationMin: null, description: "" },
      { day: "mie", type: "run", time: "18:00", durationMin: 60, description: "Tirada larga" },
    ],
  };

  it("usa parsedDays si está disponible", () => {
    const parsed = {
      coach_name: "Marcos",
      days: [{
        day_of_week: 1, session_type: "gym", session_name: "Piernas A",
        duration_min: 75,
        exercises: [{ name: "Sentadilla", aliases: [], sets: 4, reps: "8", load_kg: null, notes: null }],
      }],
    };
    const body = buildStep6Body(baseTraining, parsed);
    expect(body.training_days).toHaveLength(1);
    expect(body.training_days[0]).toMatchObject({
      day_of_week: 1, session_type: "gym", session_name: "Piernas A", duration_min: 75,
    });
    expect(body.training_days[0].exercises).toHaveLength(1);
  });

  it("convierte la semana manual cuando no hay parsedDays", () => {
    const body = buildStep6Body(baseTraining, null);
    expect(body.training_days.length).toBeGreaterThan(0);
    const lunes = body.training_days.find((d) => d.day_of_week === 1);
    expect(lunes).toBeDefined();
    expect(lunes!.session_type).toBe("gym");
  });

  it("mapea SessionType a literales del back", () => {
    const body = buildStep6Body(baseTraining, null);
    const types = body.training_days.map((d) => d.session_type);
    // strength→gym, rest→descanso, run→corrida
    expect(types).toContain("gym");
    expect(types).toContain("corrida");
  });

  it("mapea día de la semana correctamente (lun=1, dom=0)", () => {
    const body = buildStep6Body({
      ...baseTraining,
      week: [
        { day: "dom", type: "run", time: "", durationMin: null, description: "" },
        { day: "lun", type: "run", time: "", durationMin: null, description: "" },
      ],
    }, null);
    const days = body.training_days.map((d) => d.day_of_week);
    expect(days).toContain(0);
    expect(days).toContain(1);
  });

  it("omite coach_name si está vacío", () => {
    const body = buildStep6Body({ ...baseTraining, coachName: "" }, null);
    expect(body).not.toHaveProperty("coach_name");
  });

  it("filtra approx_time inválido", () => {
    const body = buildStep6Body({
      ...baseTraining,
      week: [{ day: "lun", type: "run", time: "no-es-hora", durationMin: 30, description: "" }],
    }, null);
    expect(body.training_days[0]).not.toHaveProperty("approx_time");
  });
});

/* ============ Step 7 ============ */
describe("buildStep7Body", () => {
  const baseMeals: MealsData = {
    listFile: null,
    listText: "",
    meals: [{
      id: "a",
      alias: "Desayuno 1",
      ingredients: [
        { name: "Huevo", grams: 180 },
        { name: "Pan integral", grams: 60 },
        { name: "", grams: null }, // ingrediente vacío, debe filtrarse
      ],
      notes: "",
    }],
  };

  it("convierte meals manuales", () => {
    const body = buildStep7Body(baseMeals);
    expect(body.meals).toHaveLength(1);
    expect(body.meals[0].alias).toBe("Desayuno 1");
    expect(body.meals[0].ingredients).toHaveLength(2);
  });

  it("manda macros en 0 (el UI no las captura)", () => {
    const body = buildStep7Body(baseMeals);
    const meal = body.meals[0];
    expect(meal.total_kcal).toBe(0);
    expect(meal.total_protein_g).toBe(0);
    expect(meal.ingredients[0]).toMatchObject({
      kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0, food_item_id: null,
    });
  });

  it("descarta meals sin alias o sin ingredientes con nombre", () => {
    const body = buildStep7Body({
      ...baseMeals,
      meals: [
        { id: "a", alias: "", ingredients: [{ name: "X", grams: 1 }], notes: "" },
        { id: "b", alias: "Cena", ingredients: [{ name: "", grams: null }], notes: "" },
      ],
    });
    expect(body.meals).toHaveLength(0);
  });
});

/* ============ Consent ============ */
describe("buildConsentBody", () => {
  it("mapea los flags al schema del back", () => {
    const c: Consent = { sensitiveData: true, internationalTransfer: true, nutritionDisclaimer: true };
    const body = buildConsentBody(c);
    expect(body).toEqual({
      data_processing: true,
      international_transfer: true,
      nutrition_disclaimer: true,
    });
  });
});
