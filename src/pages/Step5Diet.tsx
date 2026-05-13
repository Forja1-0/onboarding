import { OnboardingLayout } from "../onboarding/OnboardingLayout";
import { Callout, Chip, ErrorBanner } from "../onboarding/components";
import { useOnboarding } from "../onboarding/store";
import { useStepSave } from "../api/hooks";
import { buildStep5Body } from "../api/transformers";
import type { DietaryRestrictions } from "../onboarding/types";

const TAGS: { key: keyof DietaryRestrictions; label: string }[] = [
  { key: "vegan",      label: "Vegano" },
  { key: "vegetarian", label: "Vegetariano" },
  { key: "celiac",     label: "Celíaco" },
  { key: "noLactose",  label: "Sin lácteos" },
  { key: "noPork",     label: "Sin cerdo" },
  { key: "noFish",     label: "Sin pescado" },
];

export function Step5Diet() {
  const d = useOnboarding((s) => s.diet);
  const setDiet = useOnboarding((s) => s.setDiet);
  const { save, busy, error } = useStepSave(5);

  const submit = () => save(buildStep5Body(d), "entrenamiento");

  return (
    <OnboardingLayout
      step={5}
      eyebrow="Restricciones alimentarias · 30 s"
      title={<>¿Hay algo que <span className="font-serif italic font-normal text-f-green-glow">no comas?</span></>}
      lede="El sugeridor de comidas filtra todo lo que marques. Si no aplica nada, salteá — son 30 segundos."
      onContinue={submit}
      continueLabel={busy ? "Guardando…" : "Continuar"}
      continueDisabled={busy}
    >
      <div className="f-card">
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <Chip
              key={t.key}
              active={Boolean(d[t.key])}
              onToggle={() => setDiet({ [t.key]: !d[t.key] } as Partial<DietaryRestrictions>)}
            >
              {t.label}
            </Chip>
          ))}
        </div>

        <div className="mt-5">
          <label className="f-label">Otras restricciones (opcional)</label>
          <input className="f-input" placeholder="Ej: no como mariscos, evito picante…"
                 value={d.custom} onChange={(e) => setDiet({ custom: e.target.value })} />
          <p className="f-helper">Cualquier cosa que el sugeridor deba evitar. Una línea es suficiente.</p>
        </div>
      </div>

      {error && <ErrorBanner msg={error} />}

      <Callout>
        Forja no te va a sugerir lo que no comés. Marcá con honestidad — después
        no hay vuelta atrás dentro del bot.
      </Callout>
    </OnboardingLayout>
  );
}
