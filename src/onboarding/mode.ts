// Flag de modo del despliegue de onboarding.
//
// VITE_FORJA_MODE = "amateur" → gym-goer casual (steps opcionales, meta libre).
// VITE_FORJA_MODE = "elite"   → atleta competitivo (default, comportamiento legacy).
//
// Se lee una sola vez al arrancar el bundle — Vite inyecta la env en build time.

const raw = (import.meta.env.VITE_FORJA_MODE ?? "elite").toLowerCase();
export const FORJA_MODE: "amateur" | "elite" =
  raw === "amateur" ? "amateur" : "elite";

export const isAmateur = (): boolean => FORJA_MODE === "amateur";
export const isElite = (): boolean => FORJA_MODE === "elite";
