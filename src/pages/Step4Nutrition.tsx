import { useMemo, useState } from "react";
import { OnboardingLayout } from "../onboarding/OnboardingLayout";
import { Callout, Checkbox, ErrorBanner, FieldError, FileDrop, SuffixInput } from "../onboarding/components";
import { useOnboarding } from "../onboarding/store";
import { useStepSave } from "../api/hooks";
import { buildStep4Body } from "../api/transformers";
import { api, ApiError, ValidationError, type ParsedNutritionPlanRich } from "../api/client";
import { isAmateur } from "../onboarding/mode";
import { useNavigate } from "react-router-dom";

export function Step4Nutrition() {
  const n = useOnboarding((s) => s.nutrition);
  const setNutrition = useOnboarding((s) => s.setNutrition);
  const userId = useOnboarding((s) => s.userId);
  const { save, busy, error, fieldErrors } = useStepSave(4);
  const amateur = isAmateur();
  const nav = useNavigate();

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const computedKcal = useMemo(() => {
    if (!n.proteinG && !n.carbsG && !n.fatG) return null;
    return Math.round((n.proteinG ?? 0) * 4 + (n.carbsG ?? 0) * 4 + (n.fatG ?? 0) * 9);
  }, [n.proteinG, n.carbsG, n.fatG]);

  const valid = !!(n.kcal && n.proteinG && n.carbsG && n.fatG);
  const drift = computedKcal && n.kcal ? Math.abs(computedKcal - n.kcal) : 0;
  const driftWarn = drift > (n.kcal ?? 0) * 0.08; // >8% off

  const submit = () => { if (!valid) return; save(buildStep4Body(n), "restricciones"); };

  // Amateur: permitir saltear este paso (sin plan macro estructurado el bot
  // igual loguea comida y arma el resumen nocturno).
  const onSkip = amateur
    ? () => nav("/onboarding/restricciones")
    : undefined;

  const applyParsed = (parsed: ParsedNutritionPlanRich) => {
    setNutrition({
      kcal: parsed.targets.kcal ?? n.kcal,
      proteinG: parsed.targets.protein_g ?? n.proteinG,
      carbsG: parsed.targets.carbs_g ?? n.carbsG,
      fatG: parsed.targets.fat_g ?? n.fatG,
      nutritionistName: parsed.nutritionist_name ?? n.nutritionistName,
      perMealDistribution: parsed.meal_distribution.length > 0,
      parsedFromFile: true,
      parsedMeals: parsed.meal_distribution.map((m) => ({
        meal_id: m.meal_id, label: m.label, schedule: m.schedule,
        description: m.description, items: m.items, macros: m.macros, notes: m.notes,
      })),
      parsedNotes: parsed.general_notes,
    });
  };

  const onFile = async (file: File | null) => {
    setNutrition({ planFile: file });
    setUploadError(null);
    if (!file || !userId) return;
    setUploading(true);
    try {
      const { parsed } = await api.uploadNutritionPlan(userId, file);
      applyParsed(parsed);
    } catch (e) {
      if (e instanceof ValidationError) setUploadError("El back rechazo el archivo.");
      else if (e instanceof ApiError) setUploadError(e.message);
      else setUploadError(e instanceof Error ? e.message : "No se pudo procesar el archivo.");
      // Si falló, dejamos el File en el state para que el user vea qué subió
      // pero limpiamos los datos parseados anteriores para evitar mezcla.
      setNutrition({ parsedFromFile: false, parsedMeals: [], parsedNotes: [] });
    } finally {
      setUploading(false);
    }
  };

  return (
    <OnboardingLayout
      step={4}
      eyebrow="Plan nutricional · 1 min · Crítico"
      title={<>Tus <span className="font-serif italic font-normal text-f-green-glow">macros target.</span></>}
      lede="Sin macros definidos, Forja no funciona. Si todavía no los tenés, hablalos con tu nutricionista antes de seguir — esto no se inventa."
      onContinue={submit}
      continueDisabled={!valid || busy || uploading}
      continueLabel={busy ? "Guardando…" : uploading ? "Procesando archivo…" : "Continuar"}
      onSkip={onSkip}
      skipLabel="Sin plan"
    >
      <div className="f-card flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-f-green-light" style={{ fontSize: 18 }}>upload_file</span>
          <div className="font-sans font-medium text-[14px] text-f-text">Plan del nutricionista</div>
          <span className="f-pill f-pill-green ml-auto">Recomendado</span>
        </div>
        <p className="text-[12px] text-f-text2">
          Subí el PDF (o imagen) del nutri. Lo procesamos con IA para extraer tus macros,
          la distribución por comida, el meal-prep y la lista de compras. Después podés
          ajustar lo que haga falta.
        </p>
        <div>
          <label className="f-label">Nombre del nutricionista</label>
          <input className="f-input" placeholder="Lic. Juan Pérez"
                 value={n.nutritionistName} onChange={(e) => setNutrition({ nutritionistName: e.target.value })} />
        </div>
        <FileDrop
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          file={n.planFile}
          onFile={onFile}
          label="Subir plan completo"
          hint="PDF, imagen o screenshot. Hasta 10 MB."
          busy={uploading}
          busyLabel="parseando con IA"
        />
        {uploadError && <p className="text-[12px] text-f-red-light">{uploadError}</p>}
        {n.parsedFromFile && n.parsedMeals.length > 0 && (
          <div className="f-card-soft flex flex-col gap-2 !p-3 mt-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-f-green-glow" style={{ fontSize: 16 }}>auto_awesome</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-f-text3">
                Distribución detectada
              </span>
            </div>
            <ul className="flex flex-col gap-1">
              {n.parsedMeals.map((m) => (
                <li key={m.meal_id} className="text-[12px] text-f-text2">
                  <span className="text-f-text">{m.label}</span>
                  {m.schedule && <span className="font-mono text-f-text3"> · {m.schedule}</span>}
                  {m.macros.kcal != null && <span className="font-mono"> · {m.macros.kcal} kcal</span>}
                  {m.macros.protein_g != null && <span className="font-mono"> · P{m.macros.protein_g}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="f-card flex flex-col gap-4">
        <div>
          <label className="f-label">Calorías diarias</label>
          <SuffixInput value={n.kcal} onChange={(v) => setNutrition({ kcal: v ? Number(v) : null })}
                       suffix="kcal" placeholder="2400" />
          <FieldError msg={fieldErrors.target_kcal} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Macro label="Proteína" color="#5B8A64" value={n.proteinG} onChange={(v) => setNutrition({ proteinG: v })} />
          <Macro label="Carbos"   color="#C49A3C" value={n.carbsG}   onChange={(v) => setNutrition({ carbsG: v })} />
          <Macro label="Grasas"   color="#A8404D" value={n.fatG}     onChange={(v) => setNutrition({ fatG: v })} />
        </div>

        <Checkbox
          checked={n.perMealDistribution}
          onToggle={() => setNutrition({ perMealDistribution: !n.perMealDistribution })}
          label="Distribuir mis macros por comida (lo detectamos del archivo)"
        />
      </div>

      {computedKcal && n.kcal && (
        <div className="f-card flex items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 flex items-center justify-center"
               style={{ borderColor: driftWarn ? "#A8404D" : "#5B8A64" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: driftWarn ? "#A8404D" : "#5B8A64" }}>
              {driftWarn ? "priority_high" : "check"}
            </span>
          </div>
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-f-text3">Verificación</div>
            <div className="text-[14px] text-f-text mt-1">
              Tus macros suman <span className="font-mono">{computedKcal} kcal</span>
              {" · "} declaraste <span className="font-mono">{n.kcal} kcal</span>
            </div>
            <div className={`text-[12px] mt-1 ${driftWarn ? "text-f-red-light" : "text-f-text2"}`}>
              {driftWarn
                ? `Hay una diferencia de ${drift} kcal. Revisá los gramos antes de seguir.`
                : "Coincide. Vas bien."}
            </div>
          </div>
        </div>
      )}

      {error && <ErrorBanner msg={error} />}

      <Callout>
        Si los macros te suenan a chino, frená. Forja necesita números reales —
        no estimaciones de Internet. Hablalo con tu nutri y volvé.
      </Callout>
    </OnboardingLayout>
  );
}

function Macro({ label, color, value, onChange }: {
  label: string; color: string; value: number | null; onChange: (v: number | null) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-f-text2">{label}</span>
      </div>
      <SuffixInput value={value} onChange={(v) => onChange(v ? Number(v) : null)} suffix="g" placeholder="0" />
    </div>
  );
}
