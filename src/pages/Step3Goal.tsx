import { OnboardingLayout } from "../onboarding/OnboardingLayout";
import { Callout, ErrorBanner, FieldError, Segmented, SuffixInput } from "../onboarding/components";
import { useOnboarding } from "../onboarding/store";
import { useStepSave } from "../api/hooks";
import { buildStep3Body } from "../api/transformers";
import { isAmateur } from "../onboarding/mode";
import {
  CompetitionType, CustomDistance, DistanceData, GoalKind, GoalMetricUnit,
  TRI_PRESETS, TriPreset,
} from "../onboarding/types";

const TYPES: { value: CompetitionType; label: string; icon: string }[] = [
  { value: "running",   label: "Running",   icon: "directions_run" },
  { value: "trail",     label: "Trail",     icon: "terrain" },
  { value: "triathlon", label: "Triatlón",  icon: "pool" },
  { value: "cycling",   label: "Ciclismo",  icon: "directions_bike" },
  { value: "swimming",  label: "Natación",  icon: "pool" },
  { value: "strength",  label: "Fuerza",    icon: "fitness_center" },
  { value: "team",      label: "Equipo",    icon: "groups" },
  { value: "other",     label: "Otro",      icon: "more_horiz" },
];

const TYPES_WITHOUT_DISTANCE: CompetitionType[] = ["strength", "team"];
const uid = () => Math.random().toString(36).slice(2, 9);

const PERSONAL_KIND_OPTIONS: { value: GoalKind; label: string; icon: string; defaultUnit: GoalMetricUnit }[] = [
  { value: "lose_weight",    label: "Perder peso",       icon: "trending_down",  defaultUnit: "kg" },
  { value: "gain_muscle",    label: "Ganar masa",         icon: "fitness_center", defaultUnit: "kg" },
  { value: "improve_time",   label: "Mejorar tiempo",     icon: "timer",          defaultUnit: "min" },
  { value: "reach_distance", label: "Llegar a distancia", icon: "directions_run", defaultUnit: "km" },
  { value: "custom",         label: "Otra",               icon: "edit",           defaultUnit: "custom" },
];

const UNIT_OPTIONS: { value: GoalMetricUnit; label: string }[] = [
  { value: "kg",      label: "kg" },
  { value: "km",      label: "km" },
  { value: "min",     label: "min" },
  { value: "reps",    label: "reps" },
  { value: "percent", label: "%" },
];

export function Step3Goal() {
  const g = useOnboarding((s) => s.goal);
  const setGoal = useOnboarding((s) => s.setGoal);
  const { save, busy, error, fieldErrors } = useStepSave(3);
  const amateur = isAmateur();

  const today = new Date().toISOString().slice(0, 10);
  const days = g.eventDate
    ? Math.max(0, Math.ceil((new Date(g.eventDate).getTime() - Date.now()) / 86400000))
    : null;

  const competitionValid = !!g.competitionType && !!g.eventName.trim() && !!g.eventDate;
  const personalValid =
    !!g.personal.kind &&
    (g.personal.kind === "custom"
      ? !!g.personal.metricLabel.trim()
      : g.personal.metricValue != null && !!g.personal.metricUnit);
  const valid = g.mode === "competition" ? competitionValid : personalValid;

  const submit = () => {
    if (!valid) return;
    save(buildStep3Body(g), "plan-nutricional");
  };

  const onSelectType = (v: CompetitionType) => {
    const distance: DistanceData = (() => {
      if (v === "triathlon") {
        const p = TRI_PRESETS.olimpico;
        return { tri: { preset: "olimpico", swimM: p.swimM, bikeKm: p.bikeKm, runKm: p.runKm } };
      }
      if (v === "other") return { custom: [{ id: uid(), label: "", value: null, unit: "km" }] };
      if (TYPES_WITHOUT_DISTANCE.includes(v)) return {};
      return { single: { value: null, unit: v === "swimming" ? "m" : "km" } };
    })();
    setGoal({ competitionType: v, distance });
  };

  const setPersonal = (patch: Partial<typeof g.personal>) =>
    setGoal({ personal: { ...g.personal, ...patch } });

  const onSelectKind = (kind: GoalKind) => {
    const def = PERSONAL_KIND_OPTIONS.find((k) => k.value === kind);
    setPersonal({
      kind,
      metricUnit: kind === "custom" ? "custom" : def?.defaultUnit ?? null,
      // Reset value cuando cambia el tipo (km != kg).
      metricValue: null,
      metricLabel: kind === "custom" ? g.personal.metricLabel : "",
    });
  };

  return (
    <OnboardingLayout
      step={3}
      eyebrow="Objetivo · 1 min"
      title={
        amateur
          ? <>¿Cuál es <span className="font-serif italic font-normal text-f-green-glow">tu meta</span>?</>
          : <>¿Hacia <span className="font-serif italic font-normal text-f-green-glow">qué fecha</span> te estás forjando?</>
      }
      lede={
        amateur
          ? "Una meta concreta — perder kilos, ganar masa, llegar a una distancia. Eso es lo que el bot va a usar para empujarte."
          : "Esto alimenta el countdown de tu Journey. Sin fecha, no hay urgencia. Sin urgencia, no hay sistema."
      }
      onContinue={submit}
      continueDisabled={!valid || busy}
      continueLabel={busy ? "Guardando…" : "Continuar"}
    >
      {/* Toggle competition / personal — visible siempre, pero el default
          y el orden cambian segun amateur/elite. */}
      <div className="f-card-soft">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-f-text3 mb-2">
          Tipo de objetivo
        </div>
        <Segmented<"competition" | "personal">
          value={g.mode}
          onChange={(v) => setGoal({ mode: v })}
          options={
            amateur
              ? [
                  { value: "personal",    label: "Meta personal" },
                  { value: "competition", label: "Competencia" },
                ]
              : [
                  { value: "competition", label: "Competencia" },
                  { value: "personal",    label: "Meta personal" },
                ]
          }
          columns={2}
        />
      </div>

      {g.mode === "competition" && (
        <div className="f-card flex flex-col gap-4">
          <div>
            <label className="f-label">Tipo de competencia</label>
            <Segmented<CompetitionType>
              value={g.competitionType}
              onChange={onSelectType}
              options={TYPES}
              columns={2}
            />
          </div>

          <div>
            <label className="f-label">Nombre del evento</label>
            <input className="f-input" placeholder="Maratón de Buenos Aires"
                   value={g.eventName} onChange={(e) => setGoal({ eventName: e.target.value })} />
            <FieldError msg={fieldErrors.event_name} />
          </div>

          <div>
            <label className="f-label">Fecha</label>
            <input type="date" className="f-input" min={today}
                   value={g.eventDate} onChange={(e) => setGoal({ eventDate: e.target.value })} />
            <FieldError msg={fieldErrors.event_date} />
          </div>

          {g.competitionType && !TYPES_WITHOUT_DISTANCE.includes(g.competitionType) && (
            <DistanceEditor
              type={g.competitionType}
              value={g.distance}
              onChange={(distance) => setGoal({ distance })}
            />
          )}

          {g.competitionType && TYPES_WITHOUT_DISTANCE.includes(g.competitionType) && (
            <p className="f-helper">
              Para fuerza y deportes de equipo no se carga distancia. Si necesitás
              registrar metas de carga o partidos, lo ajustás después con el bot.
            </p>
          )}

          <div>
            <label className="f-label">Notas (opcional)</label>
            <textarea className="f-input" rows={2} placeholder="Sub-3:30, llegar entero, primera maratón…"
              value={g.notes} onChange={(e) => setGoal({ notes: e.target.value })} />
          </div>
        </div>
      )}

      {g.mode === "personal" && (
        <div className="f-card flex flex-col gap-4">
          <div>
            <label className="f-label">¿Qué querés lograr?</label>
            <Segmented<GoalKind>
              value={g.personal.kind}
              onChange={onSelectKind}
              options={PERSONAL_KIND_OPTIONS}
              columns={2}
            />
            <FieldError msg={fieldErrors.goal_kind} />
          </div>

          {g.personal.kind && g.personal.kind !== "custom" && (
            <div>
              <label className="f-label">Cantidad objetivo</label>
              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 110px" }}>
                <SuffixInput
                  value={g.personal.metricValue}
                  onChange={(v) => setPersonal({ metricValue: v ? Number(v) : null })}
                  suffix={g.personal.metricUnit ?? ""}
                  placeholder={g.personal.kind === "lose_weight" ? "5" : "3"}
                  step={0.1}
                />
                <select
                  className="f-input !pr-2"
                  value={g.personal.metricUnit ?? ""}
                  onChange={(e) => setPersonal({ metricUnit: e.target.value as GoalMetricUnit })}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
              <p className="f-helper">
                Por ejemplo: <span className="text-f-text">5 kg</span>,{" "}
                <span className="text-f-text">3 kg de masa</span>,{" "}
                <span className="text-f-text">10 km</span>, etc.
              </p>
            </div>
          )}

          {g.personal.kind === "custom" && (
            <div>
              <label className="f-label">Tu meta en una frase</label>
              <input
                className="f-input"
                placeholder="Hacer 10 dominadas seguidas / Correr 5k sin parar / …"
                value={g.personal.metricLabel}
                onChange={(e) => setPersonal({ metricLabel: e.target.value })}
              />
              <FieldError msg={fieldErrors.goal_metric_label} />
            </div>
          )}

          <div>
            <label className="f-label">Deadline (opcional)</label>
            <input type="date" className="f-input" min={today}
                   value={g.eventDate} onChange={(e) => setGoal({ eventDate: e.target.value })} />
            <p className="f-helper">Si tenés fecha tope dejala. Si no, no hace falta.</p>
          </div>

          <div>
            <label className="f-label">Por qué te importa (opcional)</label>
            <textarea className="f-input" rows={2}
              placeholder="Para sentirme bien con mi cuerpo, para acompañar a mi hijo a correr, etc."
              value={g.notes} onChange={(e) => setGoal({ notes: e.target.value })} />
          </div>
        </div>
      )}

      {g.mode === "competition" && days !== null && g.eventName && (
        <div className="f-card relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px]"
               style={{ background: "linear-gradient(180deg, #5B8A64 0%, #7A2832 100%)" }} />
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-f-text3">Countdown</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-[40px] text-f-text leading-[1]">{days}</span>
            <span className="font-mono text-[12px] text-f-text2">días</span>
          </div>
          <div className="font-serif italic text-[20px] text-f-text mt-2">{g.eventName}</div>
          <DistanceSummary distance={g.distance} type={g.competitionType} />
        </div>
      )}

      {error && <ErrorBanner msg={error} />}

      <Callout>
        {g.mode === "personal"
          ? "Una meta clara. Una pista en el suelo. Después solo es caminar."
          : "Una fecha. Un nombre. Eso es lo único que separa entrenar de prepararte."}
      </Callout>
    </OnboardingLayout>
  );
}

/* ----------------- Distancia dinámica ----------------- */

function DistanceEditor({
  type, value, onChange,
}: {
  type: CompetitionType;
  value: DistanceData;
  onChange: (d: DistanceData) => void;
}) {
  if (type === "triathlon") {
    const t = value.tri ?? { preset: "olimpico", ...TRI_PRESETS.olimpico };
    const setPreset = (preset: TriPreset) => {
      if (preset === "custom") {
        onChange({ tri: { preset, swimM: t.swimM, bikeKm: t.bikeKm, runKm: t.runKm } });
      } else {
        const p = TRI_PRESETS[preset];
        onChange({ tri: { preset, swimM: p.swimM, bikeKm: p.bikeKm, runKm: p.runKm } });
      }
    };
    return (
      <div className="f-card-soft">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-f-text3 mb-2">
          Distancias por disciplina
        </div>
        <Segmented<TriPreset>
          value={t.preset}
          onChange={setPreset}
          options={[
            { value: "sprint",   label: "Sprint" },
            { value: "olimpico", label: "Olímpico" },
            { value: "half",     label: "Half" },
            { value: "ironman",  label: "Ironman" },
            { value: "custom",   label: "Custom" },
          ]}
          columns={5}
        />
        <div className="grid grid-cols-3 gap-3 mt-3">
          <SubDistance icon="pool" label="Natación" value={t.swimM} unit="m"
            onChange={(v) => onChange({ tri: { ...t, preset: "custom", swimM: v } })} />
          <SubDistance icon="directions_bike" label="Bici" value={t.bikeKm} unit="km"
            onChange={(v) => onChange({ tri: { ...t, preset: "custom", bikeKm: v } })} />
          <SubDistance icon="directions_run" label="Trote" value={t.runKm} unit="km"
            onChange={(v) => onChange({ tri: { ...t, preset: "custom", runKm: v } })} />
        </div>
        <p className="f-helper mt-3">
          Tocá un preset para autocompletar. Editás los valores y se marca como Custom.
        </p>
      </div>
    );
  }

  if (type === "other") {
    const list = value.custom ?? [];
    const update = (id: string, patch: Partial<CustomDistance>) =>
      onChange({ custom: list.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
    const remove = (id: string) =>
      onChange({ custom: list.filter((d) => d.id !== id) });
    const add = () =>
      onChange({ custom: [...list, { id: uid(), label: "", value: null, unit: "km" }] });
    return (
      <div className="f-card-soft">
        <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-f-text3 mb-2">
          Distancias por disciplina
        </div>
        <p className="text-[12px] text-f-text2 mb-3">
          Agregá una por cada tramo o disciplina. Ej: <span className="text-f-text">Trote 10K</span>,
          {" "}<span className="text-f-text">Bici 30K</span>.
        </p>
        <div className="flex flex-col gap-2">
          {list.map((d) => (
            <div key={d.id} className="grid gap-2" style={{ gridTemplateColumns: "1fr 90px 70px 32px" }}>
              <input className="f-input !h-10" placeholder="Disciplina o tramo"
                value={d.label} onChange={(e) => update(d.id, { label: e.target.value })} />
              <div className="f-field">
                <input type="number" className="f-input !h-10 has-suffix" placeholder="0"
                  value={d.value ?? ""}
                  onChange={(e) => update(d.id, { value: e.target.value ? Number(e.target.value) : null })} />
                <span className="f-suffix">{d.unit}</span>
              </div>
              <select className="f-input !h-10 !pr-2" value={d.unit}
                onChange={(e) => update(d.id, { unit: e.target.value as "km" | "m" })}>
                <option value="km">km</option>
                <option value="m">m</option>
              </select>
              <button className="f-btn-ghost h-10 px-0" onClick={() => remove(d.id)} aria-label="Quitar">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove</span>
              </button>
            </div>
          ))}
        </div>
        <button className="mt-2 f-btn-ghost text-f-green-light text-[12px]" onClick={add}>
          + agregar distancia
        </button>
      </div>
    );
  }

  // Single distance (running, trail, cycling, swimming)
  const s = value.single ?? { value: null, unit: type === "swimming" ? ("m" as const) : ("km" as const) };
  const isSwim = type === "swimming";
  return (
    <div>
      <label className="f-label">Distancia total</label>
      <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 90px" }}>
        <SuffixInput
          value={s.value}
          onChange={(v) => onChange({ single: { ...s, value: v ? Number(v) : null } })}
          suffix={s.unit}
          placeholder={isSwim ? "1500" : "42.2"}
          step={0.1}
        />
        {isSwim && (
          <select className="f-input !pr-2" value={s.unit}
            onChange={(e) => onChange({ single: { ...s, unit: e.target.value as "km" | "m" } })}>
            <option value="m">m</option>
            <option value="km">km</option>
          </select>
        )}
      </div>
      <p className="f-helper">Total que recorrés en el evento (no por sesión).</p>
    </div>
  );
}

function SubDistance({
  icon, label, value, unit, onChange,
}: { icon: string; label: string; value: number | null; unit: string; onChange: (v: number | null) => void }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <span className="material-symbols-outlined text-f-green-light" style={{ fontSize: 14 }}>{icon}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-f-text2">{label}</span>
      </div>
      <SuffixInput value={value} onChange={(v) => onChange(v ? Number(v) : null)} suffix={unit} placeholder="0" step={0.1} />
    </div>
  );
}

function DistanceSummary({ distance, type }: { distance: DistanceData; type: CompetitionType | null }) {
  if (!type || TYPES_WITHOUT_DISTANCE.includes(type)) return null;
  const text = serializeDistance(distance, type);
  if (!text) return null;
  return <div className="font-mono text-[11px] text-f-text2 mt-1">{text}</div>;
}

/** Serializa la DistanceData a un string compacto para el backend (`distance`). */
export function serializeDistance(d: DistanceData, type: CompetitionType | null): string {
  if (!type || TYPES_WITHOUT_DISTANCE.includes(type)) return "";
  if (type === "triathlon" && d.tri) {
    const { swimM, bikeKm, runKm, preset } = d.tri;
    const presetLabel = preset !== "custom" ? `${TRI_PRESETS[preset].label} · ` : "";
    return `${presetLabel}${swimM ?? "—"}m / ${bikeKm ?? "—"}km / ${runKm ?? "—"}km`;
  }
  if (type === "other" && d.custom?.length) {
    return d.custom
      .filter((c) => c.value)
      .map((c) => `${c.label || "—"} ${c.value}${c.unit}`)
      .join(" · ");
  }
  if (d.single?.value) return `${d.single.value}${d.single.unit}`;
  return "";
}
