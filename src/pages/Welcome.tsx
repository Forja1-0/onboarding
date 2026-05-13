import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ambient } from "../onboarding/OnboardingLayout";
import { Wordmark } from "../onboarding/components";
import { ONBOARDING_STEPS } from "../onboarding/types";
import { useOnboarding } from "../onboarding/store";
import { api, ApiError } from "../api/client";

export function Welcome() {
  const nav = useNavigate();
  const userId = useOnboarding((s) => s.userId);
  const setUserId = useOnboarding((s) => s.setUserId);
  const reset = useOnboarding((s) => s.reset);
  const [busy, setBusy] = useState<"start" | "resume" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    if (userId) {
      nav("/onboarding/datos-personales");
      return;
    }
    setBusy("start");
    try {
      const { user_id } = await api.startOnboarding({});
      setUserId(user_id);
      nav("/onboarding/datos-personales");
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(null);
    }
  };

  const resume = async () => {
    if (!userId) return;
    setError(null);
    setBusy("resume");
    try {
      const state = await api.getOnboarding(userId);
      const next = Math.min(state.onboarding_step + 1, 8);
      const target = ONBOARDING_STEPS.find((s) => s.idx === next);
      nav(target ? `/onboarding/${target.slug}` : "/onboarding/consentimiento");
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        reset();
        setError("No encontramos tu onboarding anterior. Volvé a empezar.");
      } else {
        setError(humanError(e));
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Ambient />

      <header className="pt-8 pb-2 flex flex-col items-center gap-2 f-fade-up">
        <Wordmark />
        <span className="block w-6 h-px bg-f-green-light/70" />
      </header>

      <main className="flex-1 flex items-center">
        <div className="max-w-[460px] w-full mx-auto px-[22px]">
          <div className="font-mono text-[10px] tracking-[0.06em] uppercase text-f-green-light mb-4 f-fade-up" style={{ animationDelay: "60ms" }}>
            Onboarding · 8 pasos · ~10 min
          </div>

          <h1 className="font-sans font-bold text-[34px] leading-[1.1] text-f-text f-fade-up" style={{ animationDelay: "120ms" }}>
            Vamos a armar{" "}
            <span className="font-serif italic font-normal text-f-green-glow">tu sistema.</span>
          </h1>

          <p className="mt-4 text-[15px] leading-[1.6] text-f-text2 f-fade-up" style={{ animationDelay: "200ms" }}>
            Te vamos a preguntar quién sos, qué entrenás y qué comés.
            Es largo. Pide cosas que tienen sentido pedir. <span className="text-f-text">No es una app para cualquiera.</span>
          </p>

          <div className="mt-8 grid gap-2 f-fade-up" style={{ animationDelay: "280ms" }}>
            {ONBOARDING_STEPS.map((s) => (
              <div key={s.idx} className="flex items-center gap-3 text-[13px] text-f-text2">
                <span className="font-mono text-[10px] text-f-text3 w-5">0{s.idx}</span>
                <span className="text-f-text">{s.title}</span>
                <span className="ml-auto font-mono text-[10px] text-f-text3 uppercase">{s.eyebrow.split("·")[1]?.trim()}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 f-card-soft flex gap-3 items-start f-fade-up" style={{ animationDelay: "360ms" }}>
            <span className="material-symbols-outlined text-f-green-glow mt-0.5" style={{ fontSize: 18 }}>shield_lock</span>
            <p className="text-[13px] leading-[1.5] text-f-text">
              Datos sensibles encriptados. Podés borrar todo cuando quieras. <span className="text-f-text2">Ley 25.326.</span>
            </p>
          </div>

          {error && (
            <div className="mt-4 f-card-warn f-fade-up">
              <p className="text-[13px] text-f-red-light">{error}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="pb-7 px-[22px] f-fade-up" style={{ animationDelay: "440ms" }}>
        <div className="max-w-[460px] mx-auto flex flex-col gap-3">
          <button
            onClick={start}
            disabled={busy !== null}
            className="f-btn f-btn-primary w-full"
          >
            <span>{busy === "start" ? "Creando…" : "Empezar"}</span>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
          {userId && (
            <p className="text-center text-[12px] text-f-text3">
              ¿Ya empezaste?{" "}
              <button
                className="text-f-green-light underline-offset-4 hover:underline disabled:opacity-50"
                onClick={resume}
                disabled={busy !== null}
              >
                {busy === "resume" ? "Buscando…" : "Continuar donde quedaste"}
              </button>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

function humanError(e: unknown): string {
  if (e instanceof ApiError) return `Error ${e.status}: ${e.message}`;
  if (e instanceof Error) return `No se pudo conectar con el server. ${e.message}`;
  return "Algo falló. Probá de nuevo.";
}
