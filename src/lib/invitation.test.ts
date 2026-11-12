import { invitationUrl } from "./invitation";

describe("invitationUrl", () => {
  it("arma el enlace de la web con el token codificado", () => {
    expect(invitationUrl("a b/c")).toBe("https://leandrozamuner.github.io/mediplan-web/invitacion?token=a%20b%2Fc");
  });
});
