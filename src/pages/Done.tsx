import type { ReactNode } from "react";
import { Ambient } from "../onboarding/OnboardingLayout";
import { Wordmark } from "../onboarding/components";
import { estimateTMB, useOnboarding } from "../onboarding/store";

// Número del bot de Forja (Evolution API). E.164 sin "+" para wa.me.
const BOT_WA_NUMBER = "5492645295724";
const KICKOFF_MSG = "Hola, ¿qué podés hacer?";
const WA_URL = `https://wa.me/${BOT_WA_NUMBER}?text=${encodeURIComponent(KICKOFF_MSG)}`;

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
            Forja ya tiene todo lo que necesita. Antes de abrir WhatsApp, mirá cómo se usa.
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

          {/* TUTORIAL — Lo que Forja ya sabe */}
          <TutorialCard
            icon="memory"
            eyebrow="Memoria · Cargado del onboarding"
            title={<>Lo que <span className="font-serif italic text-f-green-glow">ya sé</span> de vos</>}
            delay={320}
          >
            <ChecklistItem text="Perfil, edad, peso, altura — para calcular calorías y carga" />
            <ChecklistItem text="Tu objetivo y la fecha — ajusto la intensidad según los días que falten" />
            <ChecklistItem text="Tu plan de entrenamiento — sé qué te toca cada día y a qué hora" />
            <ChecklistItem text="Tus targets nutricionales — kcal, proteína, carbos, grasas" />
            <ChecklistItem text="Restricciones, lesiones y medicación — no te sugiero nada que te haga mal" />
            <ChecklistItem text="Tus comidas frecuentes — las podés registrar con una palabra" />
          </TutorialCard>

          {/* TUTORIAL — Cómo hablás con Forja */}
          <TutorialCard
            icon="forum"
            eyebrow="Lo que vos hacés · Hablale natural"
            title={<>Cómo <span className="font-serif italic text-f-green-glow">hablás</span> conmigo</>}
            delay={380}
          >
            <ExampleRow user="comí 200g de pollo y arroz" bot="✅ Registrado. Te quedan 1200 kcal." />
            <ExampleRow user="completé piernas" bot="¿Qué tan duro fue? (1 a 10)" />
            <ExampleRow user="qué me toca hoy?" bot="Hoy: fuerza tren superior · 60 min" />
            <ExampleRow user="cuánta prote me falta?" bot="Faltan 38g de proteína." />
            <ExampleRow user="cómo voy esta semana?" bot="Score 82/100. Adherencia alta." />
            <ExampleRow user="me lesioné la rodilla" bot="Anotado. Ajusto el plan." />
            <ExampleRow user="hoy no entreno" bot="Anotado. Mañana retomamos." />
            <p className="mt-2 text-[12px] text-f-text2 italic">
              No hay comandos rígidos. Hablame como a un coach.
            </p>
          </TutorialCard>

          {/* TUTORIAL — Lo que Forja hace solo */}
          <TutorialCard
            icon="notifications_active"
            eyebrow="Lo que yo hago · Automático"
            title={<>Lo que hago <span className="font-serif italic text-f-green-glow">solo</span></>}
            delay={440}
          >
            <AutoItem
              icon="wb_sunny"
              title="Recordatorio matutino (lun a sáb, 6 AM)"
              body="Te aviso qué te toca, a qué hora y la duración. No tenés que pedirlo."
            />
            <AutoItem
              icon="nights_stay"
              title="Check-in de la noche"
              body="Te pregunto si cumpliste, cómo dormiste y si tuviste dolor. 30 segundos."
            />
            <AutoItem
              icon="bar_chart"
              title="Resumen semanal"
              body="Los domingos te paso el score y dónde estás flojo."
            />
            <AutoItem
              icon="health_and_safety"
              title="Cuido tus reglas no-negociables"
              body="Si tu coach marcó protocolos de rehab o alertas, los respeto antes de sugerir nada."
            />
          </TutorialCard>

          {/* TUTORIAL — Cómo reconfigurar */}
          <TutorialCard
            icon="tune"
            eyebrow="Reconfiguración · Cuando cambie algo"
            title={<>Si cambia <span className="font-serif italic text-f-green-glow">algo</span>, me avisás</>}
            delay={500}
          >
            <p className="text-[13px] text-f-text2 leading-[1.55]">
              <span className="text-f-text">Plan nuevo del coach</span> → lo subís de nuevo desde tu perfil y reemplaza al anterior, sin perder histórico.
            </p>
            <p className="text-[13px] text-f-text2 leading-[1.55] mt-2">
              <span className="text-f-text">Peso, lesión, dieta nueva</span> → mandame el cambio por WhatsApp ("ahora peso 78", "ya no como gluten") y actualizo.
            </p>
            <p className="text-[13px] text-f-text2 leading-[1.55] mt-2">
              <span className="text-f-text">Querés darte de baja</span> → escribime <span className="font-mono text-f-text">baja</span>. Borramos todo.
            </p>
          </TutorialCard>
        </div>
      </main>

      <footer className="px-5 sm:px-[22px] f-fade-up" style={{ animationDelay: "560ms", paddingBottom: "max(28px, env(safe-area-inset-bottom, 0px))" }}>
        <div className="max-w-[460px] mx-auto flex flex-col gap-3">
          <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="f-btn f-btn-primary w-full" style={{ height: 52 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chat</span>
            <span>Abrir WhatsApp con Forja</span>
          </a>
          <p className="text-center font-serif italic text-[14px] text-f-text2">
            Te abro el chat con un mensaje pre-armado. Mandalo y arranco.
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

function TutorialCard({
  icon, eyebrow, title, delay, children,
}: {
  icon: string;
  eyebrow: string;
  title: ReactNode;
  delay: number;
  children: ReactNode;
}) {
  return (
    <div className="mt-5 w-full f-card text-left f-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-f-green-light" style={{ fontSize: 18 }}>{icon}</span>
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-f-text3">{eyebrow}</div>
      </div>
      <h2 className="font-sans font-bold text-[18px] text-f-text mb-3">{title}</h2>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="material-symbols-outlined text-f-green-light mt-0.5" style={{ fontSize: 16 }}>check_circle</span>
      <span className="text-[13px] text-f-text2 leading-[1.5]">{text}</span>
    </div>
  );
}

function ExampleRow({ user, bot }: { user: string; bot: string }) {
  return (
    <div className="mt-2 first:mt-0">
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-br-sm px-3 py-1.5 text-[12px] max-w-[80%]"
             style={{ background: "#2D4532", color: "#E8E4DC" }}>
          {user}
        </div>
      </div>
      <div className="flex justify-start mt-1">
        <div className="rounded-2xl rounded-bl-sm px-3 py-1.5 text-[12px] max-w-[80%] border border-f-border"
             style={{ background: "rgba(255,255,255,0.03)", color: "#C9C5BD" }}>
          {bot}
        </div>
      </div>
    </div>
  );
}

function AutoItem({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-f-border last:border-b-0">
      <span className="material-symbols-outlined text-f-green-glow mt-0.5" style={{ fontSize: 18 }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-sans font-medium text-[13px] text-f-text">{title}</div>
        <div className="text-[12px] text-f-text2 leading-[1.5] mt-0.5">{body}</div>
      </div>
    </div>
  );
}
