import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "../onboarding/OnboardingLayout";
import { Callout, CheckboxCard, ErrorBanner } from "../onboarding/components";
import { useOnboarding } from "../onboarding/store";
import { api, ApiError, ValidationError } from "../api/client";
import { buildConsentBody } from "../api/transformers";

export function Step8Consent() {
  const nav = useNavigate();
  const c = useOnboarding((s) => s.consent);
  const setConsent = useOnboarding((s) => s.setConsent);
  const userId = useOnboarding((s) => s.userId);
  const markCompleted = useOnboarding((s) => s.markCompleted);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const all = c.sensitiveData && c.internationalTransfer && c.nutritionDisclaimer;

  const submit = async () => {
    if (!all || !userId) {
      if (!userId) nav("/");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await api.saveConsent(userId, buildConsentBody(c));
      markCompleted(8);
      nav("/onboarding/listo");
    } catch (e) {
      if (e instanceof ValidationError) {
        setError("Faltan checkboxes obligatorios.");
      } else if (e instanceof ApiError) {
        setError(`Error ${e.status}: ${e.message}`);
      } else if (e instanceof Error) {
        setError(`No se pudo conectar. ${e.message}`);
      } else {
        setError("Algo falló. Probá de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingLayout
      step={8}
      eyebrow="Consentimiento · Obligatorio · Ley 25.326"
      title={<>Tu información, <span className="font-serif italic font-normal text-f-green-glow">tu decisión.</span></>}
      lede="Forja maneja datos sensibles de salud. La ley argentina nos exige que aceptes esto explícitamente. Léelo. Importa."
      onContinue={submit}
      continueLabel={busy ? "Enviando…" : "Aceptar y finalizar"}
      continueDisabled={!all || busy}
    >
      <div className="f-card-warn">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-f-red-light" style={{ fontSize: 18 }}>warning</span>
          <div className="font-sans font-bold text-[12px] uppercase tracking-[0.08em] text-f-red-light">Disclaimer nutricional</div>
        </div>
        <p className="text-[13px] leading-[1.6] text-f-text">
          Forja <span className="text-f-text">no reemplaza</span> a un médico, nutricionista ni preparador físico.
          Los planes son sugerencias basadas en la información que cargás. Si tenés alguna condición médica,
          consultá antes de empezar.
        </p>
      </div>

      <CheckboxCard
        checked={c.sensitiveData}
        onToggle={() => setConsent({ sensitiveData: !c.sensitiveData })}
        title="Acepto el tratamiento de mis datos sensibles"
        subtitle="Salud, alimentación y entrenamiento — necesarios para el funcionamiento de Forja."
      >
        <a className="inline-block mt-2 text-[12px] text-f-green-light underline-offset-4 hover:underline" href="#" onClick={(e) => e.stopPropagation()}>
          Ver política completa →
        </a>
      </CheckboxCard>

      <CheckboxCard
        checked={c.internationalTransfer}
        onToggle={() => setConsent({ internationalTransfer: !c.internationalTransfer })}
        title="Acepto la transferencia internacional de datos"
        subtitle="Tus datos pueden ser procesados por Anthropic (EE.UU.) y Meta (WhatsApp) para el funcionamiento del bot. Bajo Cláusulas Contractuales Tipo."
      />

      <CheckboxCard
        checked={c.nutritionDisclaimer}
        onToggle={() => setConsent({ nutritionDisclaimer: !c.nutritionDisclaimer })}
        title="Leí y entendí el disclaimer nutricional"
        subtitle="Forja no reemplaza atención médica profesional."
      />

      {error && <ErrorBanner msg={error} />}

      <Callout>
        Podés revocar tu consentimiento y borrar todo cuando quieras desde tu perfil.
      </Callout>
    </OnboardingLayout>
  );
}
