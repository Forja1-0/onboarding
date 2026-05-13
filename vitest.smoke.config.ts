import { defineConfig } from "vitest/config";

// Tests de smoke: hablan con el backend remoto. Por eso van separados de los
// unit tests para no romper CI si la red falla.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.smoke.test.ts"],
    testTimeout: 45000,
    hookTimeout: 45000,
  },
});
