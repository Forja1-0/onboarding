import { Link, useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import { ONBOARDING_STEPS } from "./types";
import { useOnboarding } from "./store";

interface Props {
  step: number; // 1..8
  eyebrow: string;
  title: ReactNode;          // permite mezcla DM Sans + serif italic
  lede?: ReactNode;
  children: ReactNode;
  onBack?: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  /** Si esta definido, muestra un boton "Saltar" entre Atras y Continuar.
      Pensado para los steps opcionales del modo amateur (4, 6, 7). */
  onSkip?: () => void;
  skipLabel?: string;
}

export function OnboardingLayout({
  step, eyebrow, title, lede, children,
  onBack, onContinue, continueLabel = "Continuar", continueDisabled = false,
  onSkip, skipLabel = "Saltar",
}: Props) {
  const nav = useNavigate();
  const completed = useOnboarding((s) => s.completedSteps);

  const goBack = () => {
    if (onBack) return onBack();
    if (step <= 1) return nav("/");
    const prev = ONBOARDING_STEPS.find((s) => s.idx === step - 1);
    if (prev) nav(`/onboarding/${prev.slug}`);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Ambient />

      {/* TOP BAR */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#09090Bcc] border-b border-f-border"
              style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="max-w-[460px] mx-auto px-5 sm:px-[22px] h-14 flex items-center gap-3">
          <button onClick={goBack} aria-label="Atrás" className="f-btn-ghost -ml-2">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <ProgressSegments step={step} completed={completed} />
          <Link to="/" className="f-btn-ghost text-xs">Salir</Link>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1">
        <div className="max-w-[460px] mx-auto px-5 sm:px-[22px] pt-6 sm:pt-7 f-page-pad-bottom f-fade-up">
          <div className="font-mono text-[10px] tracking-[0.06em] uppercase text-f-green-light mb-3">
            {eyebrow}
          </div>
          <h1 className="font-sans font-bold text-[24px] sm:text-[26px] leading-[1.2] text-f-text">{title}</h1>
          {lede && <p className="mt-3 text-[14px] leading-[1.6] text-f-text2">{lede}</p>}

          <div className="mt-6 flex flex-col gap-5">{children}</div>
        </div>
      </main>

      {/* BOTTOM BAR */}
      <footer className="fixed inset-x-0 bottom-0 z-40 backdrop-blur-md bg-[#09090Bcc] border-t border-f-border"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div
          className="max-w-[460px] mx-auto px-5 sm:px-[22px] py-3 grid gap-2"
          style={{ gridTemplateColumns: onSkip ? "1fr 1fr 2fr" : "1fr 2fr" }}
        >
          <button className="f-btn f-btn-secondary" onClick={goBack}>Atrás</button>
          {onSkip && (
            <button className="f-btn f-btn-secondary" onClick={onSkip}>{skipLabel}</button>
          )}
          <button
            className="f-btn f-btn-primary"
            onClick={onContinue}
            disabled={continueDisabled}
          >
            <span>{continueLabel}</span>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

function ProgressSegments({ step, completed }: { step: number; completed: number[] }) {
  return (
    <div className="flex-1 flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        {ONBOARDING_STEPS.map((s) => {
          const done = completed.includes(s.idx);
          const current = s.idx === step;
          return (
            <div
              key={s.idx}
              className="h-1 flex-1 rounded-full"
              style={{
                background: done || current
                  ? "linear-gradient(90deg, #2D4532, #5B8A64)"
                  : "#1C1C20",
                opacity: current ? 1 : done ? 0.85 : 0.7,
              }}
            />
          );
        })}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-f-text3">
        Paso {step} / 8
      </div>
    </div>
  );
}

export function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="orb orb-green" />
      <div className="orb orb-red" />
      <div className="grain" />
    </div>
  );
}
