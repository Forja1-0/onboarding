import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Welcome } from "./pages/Welcome";
import { Step1Personal } from "./pages/Step1Personal";
import { Step2Medical } from "./pages/Step2Medical";
import { Step3Goal } from "./pages/Step3Goal";
import { Step4Nutrition } from "./pages/Step4Nutrition";
import { Step5Diet } from "./pages/Step5Diet";
import { Step6Training } from "./pages/Step6Training";
import { Step7Meals } from "./pages/Step7Meals";
import { Step8Consent } from "./pages/Step8Consent";
import { Done } from "./pages/Done";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/onboarding/datos-personales"   element={<Step1Personal />} />
        <Route path="/onboarding/historia-clinica"   element={<Step2Medical />} />
        <Route path="/onboarding/objetivo"           element={<Step3Goal />} />
        <Route path="/onboarding/plan-nutricional"   element={<Step4Nutrition />} />
        <Route path="/onboarding/restricciones"      element={<Step5Diet />} />
        <Route path="/onboarding/entrenamiento"      element={<Step6Training />} />
        <Route path="/onboarding/comidas-frecuentes" element={<Step7Meals />} />
        <Route path="/onboarding/consentimiento"     element={<Step8Consent />} />
        <Route path="/onboarding/listo"              element={<Done />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
