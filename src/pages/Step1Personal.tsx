import { OnboardingLayout } from "../onboarding/OnboardingLayout";
import { Callout, ErrorBanner, FieldError, Segmented, SuffixInput } from "../onboarding/components";
import { estimateTMB, useOnboarding } from "../onboarding/store";
import { useStepSave } from "../api/hooks";
import { buildStep1Body } from "../api/transformers";
import { isAmateur } from "../onboarding/mode";

export function Step1Personal() {
  const u = useOnboarding((s) => s.user);
  const setUser = useOnboarding((s) => s.setUser);
  const { save, busy, error, fieldErrors } = useStepSave(1);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email.trim());
  const valid = !!u.fullName.trim() && !!u.age && !!u.sex && !!u.weightKg && !!u.heightCm && emailValid;
  const tmb = estimateTMB(u);

  const submit = () => {
    if (!valid) return;
    save(buildStep1Body(u), isAmateur() ? "objetivo" : "historia-clinica");
  };

  return (
    <OnboardingLayout
      step={1}
      eyebrow="Datos personales · 2 min"
      title={<>Empecemos por <span className="font-serif italic font-normal text-f-green-glow">lo básico.</span></>}
      lede="Esto se usa para calcular tu metabolismo basal (TMB) y ajustar los macros. Cuanto más preciso, mejor el plan."
      onContinue={submit}
      continueDisabled={!valid || busy}
      continueLabel={busy ? "Guardando…" : "Continuar"}
    >
      <div className="f-card flex flex-col gap-4">
        <div>
          <label className="f-label" htmlFor="fullName">¿Cómo te llamás?</label>
          <input
            id="fullName"
            className="f-input"
            placeholder="Pedro"
            value={u.fullName}
            onChange={(e) => setUser({ fullName: e.target.value })}
            autoFocus
          />
          <FieldError msg={fieldErrors.name} />
        </div>

        <div>
          <label className="f-label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="f-input"
            placeholder="vos@ejemplo.com"
            value={u.email}
            onChange={(e) => setUser({ email: e.target.value })}
          />
          <p className="f-helper">Lo usamos para contactarte si algo importante cambia.</p>
          <FieldError msg={fieldErrors.email} />
        </div>

        <div>
          <label className="f-label" htmlFor="phoneWa">WhatsApp (opcional)</label>
          <input
            id="phoneWa"
            className="f-input"
            placeholder="5491145678901"
            value={u.phoneWa}
            onChange={(e) => setUser({ phoneWa: e.target.value })}
          />
          <p className="f-helper">Código país + número. Después lo verificamos cuando nos escribas al bot.</p>
          <FieldError msg={fieldErrors.phone_wa} />
        </div>

        <div>
          <label className="f-label">Sexo</label>
          <Segmented
            value={u.sex}
            onChange={(v) => setUser({ sex: v })}
            options={[{ value: "M", label: "Masculino" }, { value: "F", label: "Femenino" }]}
            columns={2}
          />
          <p className="f-helper">Se usa solo para el cálculo de TMB.</p>
          <FieldError msg={fieldErrors.sex} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="f-label">Edad</label>
            <SuffixInput value={u.age} onChange={(v) => setUser({ age: v ? Number(v) : null })} suffix="años" placeholder="32" min={12} />
            <FieldError msg={fieldErrors.age} />
          </div>
          <div>
            <label className="f-label">Peso</label>
            <SuffixInput value={u.weightKg} onChange={(v) => setUser({ weightKg: v ? Number(v) : null })} suffix="kg" placeholder="74" step={0.1} />
            <FieldError msg={fieldErrors.weight_kg} />
          </div>
          <div>
            <label className="f-label">Altura</label>
            <SuffixInput value={u.heightCm} onChange={(v) => setUser({ heightCm: v ? Number(v) : null })} suffix="cm" placeholder="178" />
            <FieldError msg={fieldErrors.height_cm} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-sans font-medium text-[13px] text-f-text">% Graso</span>
              <span className="f-pill f-pill-warn">Opcional</span>
            </div>
            <SuffixInput value={u.bodyFatPct} onChange={(v) => setUser({ bodyFatPct: v ? Number(v) : null })} suffix="%" placeholder="Si lo sabés" step={0.1} />
            <FieldError msg={fieldErrors.body_fat_pct} />
          </div>
        </div>

        <p className="f-helper -mt-1">El % graso es opcional — si no lo conocés, lo estimamos.</p>
      </div>

      {tmb && (
        <div className="f-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-f-green-dim border border-f-green-light/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-f-green-glow" style={{ fontSize: 22 }}>local_fire_department</span>
          </div>
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-f-text3">TMB estimado</div>
            <div className="font-sans font-bold text-[22px] text-f-text leading-[1]">
              {tmb} <span className="font-mono text-[12px] text-f-text2">kcal/día</span>
            </div>
            <div className="text-[12px] text-f-text2 mt-1">Lo afinamos en el paso 4 con tus macros.</div>
          </div>
        </div>
      )}

      {error && <ErrorBanner msg={error} />}

      <Callout>
        Tomate los segundos que necesites. Esto define todo lo que viene.
      </Callout>
    </OnboardingLayout>
  );
}

