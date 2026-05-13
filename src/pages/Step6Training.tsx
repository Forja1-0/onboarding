import { useMemo, useState } from "react";
import { OnboardingLayout } from "../onboarding/OnboardingLayout";
import { Callout, Disclosure, ErrorBanner, FileDrop, Segmented } from "../onboarding/components";
import { useOnboarding } from "../onboarding/store";
import type { SessionType, TrainingDay } from "../onboarding/types";
import { api, ApiError, ValidationError } from "../api/client";
import { useStepSave } from "../api/hooks";
import { buildStep6Body } from "../api/transformers";

const DAYS: TrainingDay["day"][] = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];
const DAY_FULL: Record<TrainingDay["day"], string> = {
  lun: "Lunes", mar: "Martes", mie: "Miércoles", jue: "Jueves", vie: "Viernes", sab: "Sábado", dom: "Domingo",
};
const DAY_NUM_TO_LABEL: Record<number, string> = {
  0: "Domingo", 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado",
};

const SESSIONS: { value: SessionType; label: string; icon: string; color: string }[] = [
  { value: "rest",     label: "Descanso", icon: "bedtime",          color: "#524F4A" },
  { value: "run",      label: "Running",  icon: "directions_run",   color: "#5B8A64" },
  { value: "bike",     label: "Bici",     icon: "directions_bike",  color: "#5B8A64" },
  { value: "swim",     label: "Natación", icon: "pool",             color: "#5B8A64" },
  { value: "strength", label: "Fuerza",   icon: "fitness_center",   color: "#C49A3C" },
  { value: "mobility", label: "Movilidad",icon: "self_improvement", color: "#abd0af" },
  { value: "race",     label: "Carrera",  icon: "flag",             color: "#A8404D" },
  { value: "other",    label: "Otro",     icon: "more_horiz",       color: "#8A8680" },
];

export function Step6Training() {
  const t = useOnboarding((s) => s.training);
  const setTraining = useOnboarding((s) => s.setTraining);
  const userId = useOnboarding((s) => s.userId);
  const { save, busy: saving, error: saveError } = useStepSave(6);

  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const week = useMemo(() => {
    const map = new Map(t.week.map((d) => [d.day, d]));
    return DAYS.map<TrainingDay>(
      (d) => map.get(d) ?? { day: d, type: "rest", time: "", durationMin: null, description: "" },
    );
  }, [t.week]);

  const updateDay = (day: TrainingDay["day"], patch: Partial<TrainingDay>) => {
    setTraining({ week: week.map((d) => (d.day === day ? { ...d, ...patch } : d)) });
  };

  const sessionsCount = week.filter((d) => d.type !== "rest").length;
  const hasText = t.planText.trim().length >= 10;
  const hasManual = sessionsCount >= 1;
  const hasParsed = !!t.parsedDays && t.parsedDays.length > 0;
  // El back acepta plan parseado o semana manual. El archivo se acepta como
  // referencia pero no se envía (no hay storage de uploads todavía).
  const valid = hasParsed || hasManual;

  const onParseText = async () => {
    if (!userId) return;
    setParseError(null);
    setParsing(true);
    try {
      const { parsed } = await api.parseTrainingPlan(userId, t.planText);
      setTraining({
        parsed: true,
        parsedDays: parsed.days,
        coachName: parsed.coach_name ?? t.coachName,
      });
    } catch (e) {
      if (e instanceof ValidationError) setParseError("Revisá el texto pegado.");
      else if (e instanceof ApiError) setParseError(e.message);
      else setParseError(e instanceof Error ? e.message : "No se pudo parsear.");
    } finally {
      setParsing(false);
    }
  };

  const clearParsed = () =>
    setTraining({ parsed: false, parsedDays: null });

  const submit = () => {
    if (!valid) return;
    save(buildStep6Body(t, t.parsedDays
      ? { coach_name: t.coachName || null, days: t.parsedDays }
      : null), "comidas-frecuentes");
  };

  return (
    <OnboardingLayout
      step={6}
      eyebrow="Plan de entrenamiento · 3 min · Crítico"
      title={<>El plan que te dio <span className="font-serif italic font-normal text-f-green-glow">tu coach.</span></>}
      lede={
        <>
          Subí el archivo o pegá el texto del WhatsApp del coach. PDF, Excel, foto, lo que tengas.
          <br /><span className="text-f-text">La precisión acá define todo lo que sigue:</span> Forja tiene que saber qué entrenás cada día.
        </>
      }
      onContinue={submit}
      continueDisabled={!valid || saving}
      continueLabel={saving ? "Guardando…" : "Continuar"}
    >
      {/* PRIMARY: upload + paste */}
      <div className="f-card flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-f-green-light" style={{ fontSize: 18 }}>upload_file</span>
          <div className="font-sans font-medium text-[14px] text-f-text">Subí el plan</div>
          <span className="f-pill f-pill-green ml-auto">Recomendado</span>
        </div>

        <div>
          <label className="f-label">Coach (opcional)</label>
          <input className="f-input" placeholder="Marcos Roberto"
                 value={t.coachName} onChange={(e) => setTraining({ coachName: e.target.value })} />
        </div>

        <FileDrop
          accept=".pdf,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.txt"
          file={t.planFile}
          onFile={(f) => setTraining({ planFile: f })}
          label="Arrastrá o tocá para subir"
          hint="PDF, Excel, captura del WhatsApp, foto del cuaderno. Por ahora se acepta como referencia — para mandarlo al back, pegá el texto abajo."
        />

        <div className="relative my-1 text-center">
          <div className="absolute inset-y-1/2 left-0 right-0 border-t border-f-border" />
          <span className="relative inline-block px-3 bg-f-card font-mono text-[10px] uppercase tracking-[0.08em] text-f-text3">
            o pegá el texto
          </span>
        </div>

        <div>
          <label className="f-label">Pegá el plan en texto</label>
          <textarea
            className="f-input"
            rows={6}
            placeholder={"Lunes\nPiernas A\nSentadilla 4x8\nPrensa 3x12\n\nMartes\nDescanso\n..."}
            value={t.planText}
            onChange={(e) => setTraining({ planText: e.target.value, parsed: false, parsedDays: null })}
            maxLength={8000}
          />
          <div className="flex items-center justify-between mt-1">
            <p className="f-helper">Si lo pegás del WhatsApp del coach, copiamos la estructura exacta.</p>
            <span className="font-mono text-[10px] text-f-text3">{t.planText.length}/8000</span>
          </div>
          {hasText && (
            <button
              className="f-btn f-btn-secondary w-full mt-3"
              onClick={onParseText}
              disabled={parsing || hasParsed}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
              <span>
                {parsing ? "Parseando…" : hasParsed ? "Plan parseado · revisá abajo" : "Parsear con IA y revisar"}
              </span>
            </button>
          )}
          {parseError && (
            <p className="mt-2 text-[12px] text-f-red-light">{parseError}</p>
          )}
        </div>
      </div>

      {/* Preview del parseo AI */}
      {hasParsed && t.parsedDays && (
        <div className="f-card flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-f-green-glow" style={{ fontSize: 18 }}>auto_awesome</span>
            <div className="font-sans font-medium text-[14px] text-f-text">Plan interpretado</div>
            <button className="ml-auto f-btn-ghost text-f-red-light text-[12px]" onClick={clearParsed}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
              <span>Descartar</span>
            </button>
          </div>
          <p className="text-[12px] text-f-text2">
            Revisá que esté bien antes de continuar. Si algo está mal, descartá y volvé a pegar el texto.
          </p>
          <div className="flex flex-col gap-2">
            {t.parsedDays.map((d, i) => (
              <div key={i} className="f-card-soft !p-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-f-text3">
                    {DAY_NUM_TO_LABEL[d.day_of_week] ?? `Día ${d.day_of_week}`}
                  </span>
                  <span className="text-[12px] text-f-text">{d.session_type}</span>
                  {d.session_name && (
                    <span className="ml-auto font-serif italic text-[13px] text-f-text">{d.session_name}</span>
                  )}
                </div>
                {d.exercises.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {d.exercises.map((ex, j) => (
                      <li key={j} className="text-[12px] text-f-text2">
                        <span className="text-f-text">{ex.name}</span>
                        {ex.sets && <span className="font-mono"> · {ex.sets}x{ex.reps ?? "?"}</span>}
                        {ex.load_kg && <span className="font-mono"> · {ex.load_kg}kg</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECONDARY: manual fallback */}
      <Disclosure
        title="¿No tenés archivo? Cargalo manual"
        subtitle="Marcá día por día qué entrenás. Es más laburo, pero igual de preciso."
        accent="warn"
        defaultOpen={hasManual && !hasParsed}
      >
        <div className="flex flex-col gap-3">
          {week.map((d) => (
            <DayRow key={d.day} d={d} onChange={(patch) => updateDay(d.day, patch)} />
          ))}

          <div className="f-card-soft flex items-center gap-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-f-text3">Esta semana</div>
            <div className="ml-auto flex items-baseline gap-2">
              <span className="font-sans font-bold text-[24px] text-f-text leading-none">{sessionsCount}</span>
              <span className="font-mono text-[11px] text-f-text2">sesiones · {7 - sessionsCount} descanso</span>
            </div>
          </div>
        </div>
      </Disclosure>

      {saveError && <ErrorBanner msg={saveError} />}

      <Callout>
        Cargá lo más fiel que tengas. Si después cambia el plan del coach, lo
        subís de nuevo y reemplaza al anterior. <span className="text-f-green-glow not-italic font-sans text-[13px]">No se pierde nada.</span>
      </Callout>
    </OnboardingLayout>
  );
}

function DayRow({ d, onChange }: { d: TrainingDay; onChange: (p: Partial<TrainingDay>) => void }) {
  const isRest = d.type === "rest";
  const session = SESSIONS.find((s) => s.value === d.type)!;
  return (
    <div className="f-card !p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-f-text3 w-12">{DAY_FULL[d.day].slice(0, 3)}</span>
        <span className="font-sans text-[14px] text-f-text">{DAY_FULL[d.day]}</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: session.color }}>{session.icon}</span>
          <span className="font-mono text-[10px] uppercase text-f-text2">{session.label}</span>
        </span>
      </div>

      <Segmented<SessionType>
        value={d.type}
        onChange={(v) => onChange({ type: v })}
        options={SESSIONS.map((s) => ({ value: s.value, label: s.label }))}
        columns={4}
      />

      {!isRest && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="f-label">Hora</label>
            <input type="time" className="f-input" value={d.time}
                   onChange={(e) => onChange({ time: e.target.value })} />
          </div>
          <div>
            <label className="f-label">Duración</label>
            <div className="f-field">
              <input type="number" className="f-input has-suffix" placeholder="60"
                     value={d.durationMin ?? ""}
                     onChange={(e) => onChange({ durationMin: e.target.value ? Number(e.target.value) : null })} />
              <span className="f-suffix">min</span>
            </div>
          </div>
          <div className="col-span-2">
            <label className="f-label">Detalle (opcional)</label>
            <input className="f-input" placeholder="Ej: 12 km zona 2 + 6 sprints"
                   value={d.description}
                   onChange={(e) => onChange({ description: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}
