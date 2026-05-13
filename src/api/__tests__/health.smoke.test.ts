import { describe, expect, it } from "vitest";
import https from "node:https";

// Smoke test contra el back remoto. Se corre con `npm run test:smoke`.
// Usamos `node:https` en lugar de `fetch` porque undici tiene un connectTimeout
// hardcoded de 10s y EasyPanel puede tener cold-starts de >10s. En el browser
// los tiempos default son distintos y el frontend real no sufre esto.
const BASE = process.env.VITE_API_URL ?? "https://pedro-proyecto-backend.l7on3x.easypanel.host";

function get(url: string, timeoutMs = 45000): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error(`timeout after ${timeoutMs}ms`));
    });
  });
}

describe("backend remoto", () => {
  it("/healthz responde 200 con { ok, ts }", async () => {
    const { status, body } = await get(`${BASE}/healthz`);
    expect(status).toBe(200);
    const json = JSON.parse(body);
    expect(json.ok).toBe(true);
    expect(typeof json.ts).toBe("string");
  });
});
