import { assistantErrorMessage, contextOf, MAX_CONTEXT } from "@/lib/assistant";
import { ApiError } from "@/lib/api";

describe("assistant", () => {
  it("dado un error 429, entonces pide esperar", () => {
    expect(assistantErrorMessage(new ApiError(429, "x"))).toMatch(/Esperá un momento/);
  });
  it("dado un error 503, entonces avisa que no está disponible", () => {
    expect(assistantErrorMessage(new ApiError(503, "x"))).toMatch(/no está disponible/);
  });
  it("dada una conversación larga, entonces se recortan los últimos mensajes y empieza por uno de la persona", () => {
    const history = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 === 0 ? "user" : "assistant", text: String(i) }) as const);
    const ctx = contextOf([...history]);
    expect(ctx.length).toBeLessThanOrEqual(MAX_CONTEXT);
    expect(ctx[0].role).toBe("user");
    expect(ctx[ctx.length - 1].text).toBe("29");
  });
  it("dada una conversación sin mensajes de la persona, entonces queda vacía", () => {
    expect(contextOf([{ role: "assistant", text: "hola" }])).toEqual([]);
  });
});
