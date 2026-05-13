import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "../onboarding/OnboardingLayout";
import { Callout, Disclosure, FileDrop } from "../onboarding/components";
import { useOnboarding } from "../onboarding/store";
import type { FrequentMeal } from "../onboarding/types";

const uid = () => Math.random().toString(36).slice(2, 9);

const SUGGESTED_ALIASES = ["Desayuno 1", "Pre-entreno", "Post-entreno", "Almuerzo tipo", "Merienda", "Cena tipo", "Snack"];

export function Step7Meals() {
  const nav = useNavigate();
  const m = useOnboarding((s) => s.meals);
  const setMeals = useOnboarding((s) => s.setMeals);
  const nutritionistPlanFile = useOnboarding((s) => s.nutrition.planFile);
  const markCompleted = useOnboarding((s) => s.markCompleted);

  const addMeal = (alias = "") =>
    setMeals({ meals: [...m.meals, { id: uid(), alias, ingredients: [{ name: "", grams: null }], notes: "" }] });
  const removeMeal = (id: string) =>
    setMeals({ meals: m.meals.filter((x) => x.id !== id) });
  const updateMeal = (id: string, patch: Partial<FrequentMeal>) =>
    setMeals({ meals: m.meals.map((x) => (x.id === id ? { ...x, ...patch } : x)) });

  const hasFile = !!m.listFile;
  const hasText = m.listText.trim().length >= 10;
  const hasManual = m.meals.length >= 1
    && m.meals.every((x) => x.alias.trim() && x.ingredients.some((i) => i.name.trim()));
  const valid = hasFile || hasText || hasManual;

  const submit = () => { if (!valid) return; markCompleted(7); nav("/onboarding/consentimiento"); };

  return (
    <OnboardingLayout
      step={7}
      eyebrow="Comidas frecuentes · 3 min · Inversión inicial"
      title={<>Las comidas que <span className="font-serif italic font-normal text-f-green-glow">ya repetís.</span></>}
      lede={
        <>
          Acá no cargás un menú nuevo. Cargás <span className="text-f-text">lo que ya hacés todas las semanas</span> —
          tu desayuno tipo, tu pre-entreno de siempre, esa cena que se repite. La inversión de hoy hace que mañana
          loguear una comida en WhatsApp te tome <span className="text-f-text">3 segundos</span>.
        </>
      }
      onContinue={submit}
      continueDisabled={!valid}
    >
      {/* Si en paso 4 ya subió plan del nutri, aclaramos el matiz */}
      {nutritionistPlanFile && (
        <div className="f-card-soft flex gap-3 items-start">
          <span className="material-symbols-outlined text-f-green-glow mt-0.5" style={{ fontSize: 18 }}>info</span>
          <div className="text-[13px] leading-[1.5] text-f-text">
            Subiste el plan de tu nutricionista (<span className="font-mono text-f-text2">{nutritionistPlanFile.name}</span>).
            Ese plan da los macros generales — no las comidas. <span className="text-f-text2">Acá igual te conviene cargar las
            que vos repetís</span>: el bot las usa para que no tengas que escribir gramo por gramo cada vez.
          </div>
        </div>
      )}

      {/* PRIMARY: upload del listado */}
      <div className="f-card flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-f-green-light" style={{ fontSize: 18 }}>upload_file</span>
          <div className="font-sans font-medium text-[14px] text-f-text">Subí tu listado de comidas</div>
          <span className="f-pill f-pill-green ml-auto">Recomendado</span>
        </div>

        <p className="text-[12px] text-f-text2">
          ¿Tenés un listado o foto de las comidas que repetís? PDF, imagen, hoja de cálculo, o el texto del
          chat con tu nutri. Lo procesamos y te lo dejamos prearmado.
        </p>

        <FileDrop
          accept=".pdf,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.txt"
          file={m.listFile}
          onFile={(f) => setMeals({ listFile: f })}
          label="Subir listado"
          hint="PDF, imagen o texto. Ideal: comidas con ingredientes y porciones."
        />

        <div className="relative my-1 text-center">
          <div className="absolute inset-y-1/2 left-0 right-0 border-t border-f-border" />
          <span className="relative inline-block px-3 bg-f-card font-mono text-[10px] uppercase tracking-[0.08em] text-f-text3">
            o pegá el texto
          </span>
        </div>

        <div>
          <label className="f-label">Pegá tus comidas tipo</label>
          <textarea
            className="f-input"
            rows={6}
            placeholder={"Desayuno 1\n3 huevos 180g\n2 tostadas integrales 60g\nCafé con leche 200ml\n\nPre-entreno\nBanana 120g\nAvena 50g\n..."}
            value={m.listText}
            onChange={(e) => setMeals({ listText: e.target.value })}
            maxLength={8000}
          />
          <div className="flex items-center justify-between mt-1">
            <p className="f-helper">Una etiqueta por comida (Desayuno 1, Pre-entreno, etc.) y los ingredientes con gramos.</p>
            <span className="font-mono text-[10px] text-f-text3">{m.listText.length}/8000</span>
          </div>
        </div>
      </div>

      {/* SECONDARY: editor manual */}
      <Disclosure
        title="¿Preferís cargarlas a mano? Editor manual"
        subtitle="Da más control. Conviene si tenés pocas comidas tipo y querés precisión absoluta."
        accent="warn"
        defaultOpen={hasManual && !hasFile && !hasText}
      >
        {/* Aclaración de qué es el alias */}
        <div className="f-card-soft mb-3 text-[12.5px] leading-[1.5] text-f-text">
          <div className="font-sans font-medium text-f-text mb-1">Sobre el "nombre" de cada comida</div>
          <p className="text-f-text2">
            No es el nombre del plato — es <span className="text-f-text">la etiqueta que vos le ponés</span> para
            referirte a esa comida. Lo usás vos y el bot. Ej: <span className="font-mono text-f-text">"Desayuno 1"</span>,{" "}
            <span className="font-mono text-f-text">"Pre-entreno"</span>, <span className="font-mono text-f-text">"Cena rápida"</span>.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {m.meals.map((meal, idx) => (
            <MealCard key={meal.id} meal={meal} idx={idx + 1}
                      onChange={(p) => updateMeal(meal.id, p)}
                      onRemove={() => removeMeal(meal.id)} />
          ))}
        </div>

        {m.meals.length === 0 && (
          <div className="f-card text-center mb-3">
            <p className="font-serif italic text-[16px] text-f-text">Empezá por la comida que repetís todas las mañanas.</p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {SUGGESTED_ALIASES.slice(0, 5).map((label) => (
                <button key={label} className="f-btn f-btn-secondary !h-8 text-[12px]" onClick={() => addMeal(label)}>
                  + {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="f-btn f-btn-secondary w-full mt-2" onClick={() => addMeal()}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          <span>Agregar comida</span>
        </button>
      </Disclosure>

      <Callout>
        Cargá las que de verdad repetís — no hace falta cubrir todo lo que comés.
        Las que falten las vamos sumando con el tiempo desde el chat.
      </Callout>
    </OnboardingLayout>
  );
}

function MealCard({ meal, idx, onChange, onRemove }: {
  meal: FrequentMeal; idx: number;
  onChange: (p: Partial<FrequentMeal>) => void;
  onRemove: () => void;
}) {
  const updateIng = (i: number, patch: Partial<{ name: string; grams: number | null }>) => {
    const next = meal.ingredients.map((ing, j) => (j === i ? { ...ing, ...patch } : ing));
    onChange({ ingredients: next });
  };
  const addIng = () => onChange({ ingredients: [...meal.ingredients, { name: "", grams: null }] });
  const removeIng = (i: number) => onChange({ ingredients: meal.ingredients.filter((_, j) => j !== i) });

  return (
    <div className="f-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-f-text3">Comida 0{idx}</span>
        <button className="ml-auto f-btn-ghost text-f-red-light" onClick={onRemove} aria-label="Quitar">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
        </button>
      </div>

      <input className="f-input mb-1" placeholder='Etiqueta — ej: "Desayuno 1", "Pre-entreno"'
             value={meal.alias} onChange={(e) => onChange({ alias: e.target.value })} />
      <p className="f-helper mb-3">Cómo le decís vos a esta comida.</p>

      <div className="flex flex-col gap-2">
        {meal.ingredients.map((ing, i) => (
          <div key={i} className="grid gap-2" style={{ gridTemplateColumns: "1fr 90px 32px" }}>
            <input className="f-input !h-10" placeholder="Ingrediente"
                   value={ing.name}
                   onChange={(e) => updateIng(i, { name: e.target.value })} />
            <div className="f-field">
              <input type="number" className="f-input !h-10 has-suffix" placeholder="0"
                     value={ing.grams ?? ""}
                     onChange={(e) => updateIng(i, { grams: e.target.value ? Number(e.target.value) : null })} />
              <span className="f-suffix">g</span>
            </div>
            <button className="f-btn-ghost h-10 px-0" onClick={() => removeIng(i)} aria-label="Quitar ingrediente">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>remove</span>
            </button>
          </div>
        ))}
      </div>

      <button className="mt-2 f-btn-ghost text-f-green-light text-[12px]" onClick={addIng}>
        + ingrediente
      </button>

      <div className="mt-3">
        <input className="f-input !h-10" placeholder="Notas (opcional). Ej: 'café con leche descremada'"
               value={meal.notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </div>
    </div>
  );
}
