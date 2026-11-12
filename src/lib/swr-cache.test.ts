import { pickPersistable, restoreEntries, PERSIST_KEYS } from "./swr-cache";

describe("caché persistente de SWR", () => {
  it("guarda solo los datos de las claves permitidas (nada de claves con parámetros ni errores)", () => {
    const entries: [string, unknown][] = [
      ["/plans", { data: [{ id: "p1" }], error: undefined, isLoading: false }],
      ["/notifications", { data: [], isValidating: true }],
      ["$inf$/algo", { data: 1 }],
      ["/plans/abc/caregivers", { data: [{ email: "x" }] }],
      ["/me", { data: { email: "a@b.c" } }],
    ];
    const out = pickPersistable(entries);
    expect(Object.keys(out).sort()).toEqual(["/notifications", "/plans"]);
    expect(out["/plans"]).toEqual([{ id: "p1" }]);
  });
  it("no guarda entradas sin datos", () => {
    expect(pickPersistable([["/plans", { data: undefined, error: new Error("x") }]])).toEqual({});
  });
  it("restaura como entradas de SWR con { data }", () => {
    expect(restoreEntries('{"/plans":[{"id":"p1"}]}')).toEqual([["/plans", { data: [{ id: "p1" }] }]]);
  });
  it("tolera JSON roto o vacío", () => {
    expect(restoreEntries("{no es json")).toEqual([]);
    expect(restoreEntries(null)).toEqual([]);
  });
  it("las claves permitidas incluyen planes, supervisados, invitaciones y avisos", () => {
    expect(PERSIST_KEYS).toEqual(expect.arrayContaining(["/plans", "/plans/supervised", "/invitations", "/notifications"]));
  });
});
