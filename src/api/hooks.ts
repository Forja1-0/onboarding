import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError, ValidationError } from "./client";
import { useOnboarding } from "../onboarding/store";

export interface SubmitState {
  busy: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

export function useApiSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setFieldErrors({});
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      if (e instanceof ValidationError) {
        setFieldErrors(e.fields);
        setError("Revisá los campos marcados.");
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

  return { busy, error, fieldErrors, run, setError };
}

/** Hook común para los step pages: maneja userId guard, save, navigate. */
export function useStepSave(step: number) {
  const nav = useNavigate();
  const userId = useOnboarding((s) => s.userId);
  const markCompleted = useOnboarding((s) => s.markCompleted);
  const state = useApiSubmit();

  const save = (body: unknown, nextSlug: string) =>
    state.run(async () => {
      if (!userId) {
        nav("/");
        return;
      }
      await api.saveStep(userId, step, body);
      markCompleted(step);
      nav(`/onboarding/${nextSlug}`);
    });

  return { save, ...state };
}
