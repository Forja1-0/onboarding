import { Ambient } from "../onboarding/OnboardingLayout";
import { Wordmark } from "../onboarding/components";
import { estimateTMB, useOnboarding } from "../onboarding/store";
import { ONBOARDING_STEPS } from "../onboarding/types";

export function Done() {
  const s = useOnboarding();
  const tmb = estimateTMB(s.user);
  const days = s.goal.eventDate
    ? Math.max(0, Math.ceil((new Date(s.goal.eventDate).getTime() - Date.now()) / 86400000))
    : null;
  const trainings = s.training.planFile || s.training.planText.trim()
    ? "✓"
    : `${s.training.week.filter((d) => d.type !== "rest").length}`;
  const mealsCount = s.meals.listFile || s.meals.listText.trim()
    ? "✓"
    : `${s.meals.meals.length}`;

  return (
    <div className="min-h-dvh flex flex-col">
      <Ambient />

      <header className="pt-8 pb-2 flex flex-col items-center gap-2 f-fade-up">
        <Wordmark />
        <span className="block w-6 h-px bg-f-green-glow/80" />
      </header>

      <main className="flex-1">
        <div className="max-w-[460px] mx-auto px-5 sm:px-[22px] py-8 flex flex-col items-center text-center">
          {/* Hero check */}
          <div className="relative w-24 h-24 mb-6 f-fade-up">
            <div className="absolute inset-0 rounded-full f-pulse"
                 style={{ background: "radial-gradient(circle, rgba(171,208,175,0.45), transparent 70%)" }} />
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center border border-f-green-light/40"
                 style={{ background: "linear-gradient(135deg, #2D4532, #5B8A64)" }}>
              <span className="material-symbols-outlined text-f-text" style={{ fontSize: 44 }}>check</span>
            </div>
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-f-green-glow mb-3 f-fade-up" style={{ animationDelay: "80ms" }}>
            Onboarding completo
          </div>
          <h1 className="font-sans font-bold text-[30px] sm:text-[34px] leading-[1.1] text-f-text f-fade-up" style={{ animationDelay: "140ms" }}>
            <span className="font-serif italic font-normal text-f-green-glow">Listo</span>{s.user.fullName ? `, ${s.user.fullName.split(" ")[0]}.` : "."}
          </h1>
          <p className="mt-3 text-[14px] text-f-text2 max-w-sm f-fade-up" style={{ animationDelay: "200ms" }}>
            Tu sistema está armado. Desde ahora, Forja entrena con vos todos los días.
          </p>

          {/* Journey card */}
          <div className="mt-7 w-full f-card text-left relative overflow-hidden f-fade-up" style={{ animationDelay: "260ms" }}>
            <div className="absolute left-0 top-0 bottom-0 w-[3px]"
                 style={{ background: "linear-gradient(180deg, #5B8A64 0%, #7A2832 100%)" }} />
            <div className="flex items-baseline justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-f-text3">Tu objetivo</div>
              {days !== null && (
                <div className="font-mono text-[26px] text-f-text leading-none">
                  {days}<span className="text-[12px] text-f-text2 ml-1">días</span>
                </div>
              )}
            </div>
            <div className="font-serif italic text-[22px] text-f-text mt-1">
              {s.goal.eventName || "Tu próxima carrera"}
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              <Stat label="TMB" value={tmb ? `${tmb}` : "—"} unit="kcal" />
              <Stat label="Macros" value={`${s.nutrition.proteinG ?? 0}/${s.nutrition.carbsG ?? 0}/${s.nutrition.fatG ?? 0}`} />
              <Stat label="Entrenos" value={trainings} unit="/sem" />
              <Stat label="Comidas" value={mealsCount} unit="cargadas" />
            </div>

            <div className="mt-4 h-1.5 rounded-full bg-f-elevated overflow-hidden">
              <div className="h-full" style={{
                width: "4%",
                background: "linear-gradient(90deg, #2D4532, #5B8A64)",
              }} />
            </div>
          </div>

          {/* Verificación de pasos */}
          <div className="mt-5 w-full f-card text-left f-fade-up" style={{ animationDelay: "340ms" }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-f-text3 mb-3">8 pasos completados</div>
            <ul className="flex flex-col gap-2">
              {ONBOARDING_STEPS.map((step) => (
                <li key={step.idx} className="flex items-center gap-2 text-[13px]">
                  <span className="material-symbols-outlined text-f-green-light" style={{ fontSize: 16 }}>check_circle</span>
                  <span className="text-f-text">{step.title}</span>
                  <a href="#" className="ml-auto text-[11px] text-f-green-light underline-offset-4 hover:underline">Editar</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <footer className="px-5 sm:px-[22px] f-fade-up" style={{ animationDelay: "420ms", paddingBottom: "max(28px, env(safe-area-inset-bottom, 0px))" }}>
        <div className="max-w-[460px] mx-auto flex flex-col gap-3">
          <a href="https://wa.me/" className="f-btn f-btn-primary w-full" style={{ height: 52 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat</span>
            <span>Ir a WhatsApp</span>
          </a>
          <p className="text-center font-serif italic text-[14px] text-f-text2">
            El primer mensaje te llega en menos de un minuto.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.08em] text-f-text3">{label}</div>
      <div className="font-sans font-bold text-[18px] text-f-text leading-none mt-1">{value}</div>
      {unit && <div className="font-mono text-[10px] text-f-text2 mt-0.5">{unit}</div>}
    </div>
  );
}
