import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Consent, DietaryRestrictions, Goal, MealsData,
  MedicalHistory, NutritionPlan, OnboardingState, TrainingPlan, UserData,
} from "./types";

const initial: OnboardingState = {
  userId: null,
  user: { fullName: "", age: null, sex: null, weightKg: null, heightCm: null, bodyFatPct: null, email: "", phoneWa: "" },
  medical: { activeInjuries: "", pastInjuries: "", chronicConditions: "", allergies: "", medication: "", uploads: [] },
  goal: { competitionType: null, eventName: "", eventDate: "", distance: {}, notes: "" },
  nutrition: { kcal: null, proteinG: null, carbsG: null, fatG: null, perMealDistribution: false, nutritionistName: "", planFile: null },
  diet: { vegan: false, vegetarian: false, celiac: false, noLactose: false, noPork: false, noFish: false, custom: "" },
  training: { coachName: "", planFile: null, planText: "", parsed: false, parsedDays: null, week: [] },
  meals: { listFile: null, listText: "", meals: [] },
  consent: { sensitiveData: false, internationalTransfer: false, nutritionDisclaimer: false },
  completedSteps: [],
};

interface Actions {
  setUserId:     (id: string) => void;
  setUser:       (v: Partial<UserData>) => void;
  setMedical:    (v: Partial<MedicalHistory>) => void;
  setGoal:       (v: Partial<Goal>) => void;
  setNutrition:  (v: Partial<NutritionPlan>) => void;
  setDiet:       (v: Partial<DietaryRestrictions>) => void;
  setTraining:   (v: Partial<TrainingPlan>) => void;
  setMeals:      (v: Partial<MealsData>) => void;
  setConsent:    (v: Partial<Consent>) => void;
  markCompleted: (step: number) => void;
  reset: () => void;
}

export const useOnboarding = create<OnboardingState & Actions>()(
  persist(
    (set) => ({
      ...initial,
      setUserId:     (id) => set(() => ({ userId: id })),
      setUser:       (v) => set((s) => ({ user: { ...s.user, ...v } })),
      setMedical:    (v) => set((s) => ({ medical: { ...s.medical, ...v } })),
      setGoal:       (v) => set((s) => ({ goal: { ...s.goal, ...v } })),
      setNutrition:  (v) => set((s) => ({ nutrition: { ...s.nutrition, ...v } })),
      setDiet:       (v) => set((s) => ({ diet: { ...s.diet, ...v } })),
      setTraining:   (v) => set((s) => ({ training: { ...s.training, ...v } })),
      setMeals:      (v) => set((s) => ({ meals: { ...s.meals, ...v } })),
      setConsent:    (v) => set((s) => ({ consent: { ...s.consent, ...v } })),
      markCompleted: (step) =>
        set((s) => ({
          completedSteps: s.completedSteps.includes(step)
            ? s.completedSteps
            : [...s.completedSteps, step].sort((a, b) => a - b),
        })),
      reset: () => set(() => ({ ...initial })),
    }),
    { name: "forja.onboarding.v2" },
  ),
);

/** Estimación TMB Mifflin-St Jeor para feedback visual. */
export function estimateTMB(u: UserData): number | null {
  if (!u.weightKg || !u.heightCm || !u.age || !u.sex || u.sex === "X") return null;
  const base = 10 * u.weightKg + 6.25 * u.heightCm - 5 * u.age;
  return Math.round(u.sex === "M" ? base + 5 : base - 161);
}
