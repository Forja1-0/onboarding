import { OnboardingLayout } from "../onboarding/OnboardingLayout";
import { Callout, ErrorBanner } from "../onboarding/components";
import { useOnboarding } from "../onboarding/store";
import { useStepSave } from "../api/hooks";
import { buildStep2Body } from "../api/transformers";
import { isAmateur } from "../onboarding/mode";

export function Step2Medical() {
  const m = useOnboarding((s) => s.medical);
  const setMedical = useOnboarding((s) => s.setMedical);
  const { save, busy, error } = useStepSave(2);
  const amateur = isAmateur();

  const submit = () => save(buildStep2Body(m), "objetivo");

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    setMedical({ uploads: [...m.uploads, ...Array.from(files)] });
  };

  return (
    <OnboardingLayout
      step={2}
      eyebrow="Historia clínica · 2 min · Confidencial"
      title={<>Ahora, <span className="font-serif italic font-normal text-f-green-glow">la verdad médica.</span></>}
      lede="Ninguna app fitness te pregunta esto. Forja sí. No es para vendértelo: es para no romperte. Si algo no aplica, dejalo en blanco."
      onContinue={submit}
      continueDisabled={busy}
      continueLabel={busy ? "Guardando…" : "Continuar"}
    >
      <div className="f-card flex flex-col gap-4">
        <Field label="Lesiones activas" hint="¿Algo te molesta hoy? Tendinitis, sobrecarga, dolor que volvió.">
          <textarea className="f-input" rows={3} placeholder="Ej: tendinitis aquilea derecha, leve, hace 2 semanas."
            value={m.activeInjuries} onChange={(e) => setMedical({ activeInjuries: e.target.value })} />
        </Field>

        <Field label="Lesiones previas" hint="Lo que ya superaste, pero sigue siendo una bandera amarilla.">
          <textarea className="f-input" rows={2} placeholder="Ej: rotura LCA 2021, fractura tibia 2018."
            value={m.pastInjuries} onChange={(e) => setMedical({ pastInjuries: e.target.value })} />
        </Field>

        <Field label="Condiciones crónicas" hint="Separá con coma.">
          <textarea className="f-input" rows={2} placeholder="Diabetes, hipertensión, asma, hipotiroidismo…"
            value={m.chronicConditions} onChange={(e) => setMedical({ chronicConditions: e.target.value })} />
        </Field>

        <div className="grid grid-cols-1 gap-3">
          <Field label="Alergias" hint="Separá con coma.">
            <input className="f-input" placeholder="Maní, lactosa, polen…"
              value={m.allergies} onChange={(e) => setMedical({ allergies: e.target.value })} />
          </Field>
          <Field label="Medicación actual" hint="Separá con coma.">
            <input className="f-input" placeholder="Levotiroxina, ibuprofeno SOS…"
              value={m.medication} onChange={(e) => setMedical({ medication: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* Bloque de uploads de estudios medicos: solo elite.
          El amateur no necesita subir ECG/RX/sangre. */}
      {!amateur && (
        <div className="f-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-f-text2" style={{ fontSize: 18 }}>upload_file</span>
            <div className="font-sans font-medium text-[14px] text-f-text">Estudios (opcional)</div>
            <span className="f-pill f-pill-warn ml-auto">Opcional</span>
          </div>
          <p className="text-[12px] text-f-text2 mb-3">
            Subí tu último ECG, RX o análisis de sangre si lo tenés a mano. Forja los lee y los tiene en cuenta.
          </p>
          <label className="f-btn f-btn-secondary w-full cursor-pointer">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>attach_file</span>
            <span>Subir archivo</span>
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </label>
          {m.uploads.length > 0 && (
            <>
              <ul className="mt-3 flex flex-col gap-1.5">
                {m.uploads.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12px] text-f-text2">
                    <span className="material-symbols-outlined text-f-green-light" style={{ fontSize: 14 }}>check_circle</span>
                    <span className="truncate">{f.name}</span>
                    <span className="ml-auto font-mono text-f-text3">{Math.round(f.size / 1024)} KB</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-f-text3">
                Los archivos se almacenarán cuando habilitemos el storage. Por ahora se registra solo la referencia.
              </p>
            </>
          )}
        </div>
      )}

      {error && <ErrorBanner msg={error} />}

      <Callout>
        Esto queda entre vos y Forja. Encriptado, separado del resto, borrable cuando quieras.
      </Callout>
    </OnboardingLayout>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="f-label">{label}</label>
      {children}
      {hint && <p className="f-helper">{hint}</p>}
    </div>
  );
}
