import { useMemo } from "react";
import { OnboardingLayout } from "../onboarding/OnboardingLayout";
import { Callout, Checkbox, ErrorBanner, FieldError, FileDrop, SuffixInput } from "../onboarding/components";
import { useOnboarding } from "../onboarding/store";
import { useStepSave } from "../api/hooks";
import { buildStep4Body } from "../api/transformers";

export function Step4Nutrition() {
  const n = useOnboarding((s) => s.nutrition);
  const setNutrition = useOnboarding((s) => s.setNutrition);
  const { save, busy, error, fieldErrors } = useStepSave(4);

  const computedKcal = useMemo(() => {
    if (!n.proteinG && !n.carbsG && !n.fatG) return null;
    return Math.round((n.proteinG ?? 0) * 4 + (n.carbsG ?? 0) * 4 + (n.fatG ?? 0) * 9);
  }, [n.proteinG, n.carbsG, n.fatG]);

  const valid = !!(n.kcal && n.proteinG && n.carbsG && n.fatG);
  const drift = computedKcal && n.kcal ? Math.abs(computedKcal - n.kcal) : 0;
  const driftWarn = drift > (n.kcal ?? 0) * 0.08; // >8% off

  const submit = () => { if (!valid) return; save(buildStep4Body(n), "restricciones"); };

  return (
    <OnboardingLayout
      step={4}
      eyebrow="Plan nutricional · 1 min · Crítico"
      title={<>Tus <span className="font-serif italic font-normal text-f-green-glow">macros target.</span></>}
      lede="Sin macros definidos, Forja no funciona. Si todavía no los tenés, hablalos con tu nutricionista antes de seguir — esto no se inventa."
      onContinue={submit}
      continueDisabled={!valid || busy}
      continueLabel={busy ? "Guardando…" : "Continuar"}
    >
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
          label="Quiero distribuir mis macros por comida (lo definimos después)"
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

      <div className="f-card flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-f-text2" style={{ fontSize: 18 }}>upload_file</span>
          <div className="font-sans font-medium text-[14px] text-f-text">Plan del nutricionista</div>
          <span className="f-pill f-pill-warn ml-auto">Opcional</span>
        </div>
        <p className="text-[12px] text-f-text2">
          Si tenés el archivo del nutri (PDF, imagen, screenshot), subilo. Lo guardamos como referencia
          y queda atado a tu cuenta.
        </p>
        <div>
          <label className="f-label">Nombre del nutricionista</label>
          <input className="f-input" placeholder="Lic. Juan Pérez"
                 value={n.nutritionistName} onChange={(e) => setNutrition({ nutritionistName: e.target.value })} />
        </div>
        <FileDrop
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          file={n.planFile}
          onFile={(f) => setNutrition({ planFile: f })}
          label="Subir plan completo"
          hint="PDF, imagen o screenshot. Pesa hasta 10 MB."
        />
      </div>

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
