import { cancelDoseAlarms } from "@/notifications/dose-alarms";
import { ApiError, api } from "./api";
import { recordTakenOrQueue } from "./takes-queue";

jest.mock("./api", () => {
  class ApiError extends Error {
    status: number;
    constructor(status: number, m: string) {
      super(m);
      this.status = status;
    }
  }
  return { ApiError, api: jest.fn() };
});
jest.mock("@/notifications/dose-alarms", () => ({ cancelDoseAlarms: jest.fn().mockResolvedValue(undefined) }));

describe("recordTakenOrQueue y las alarmas repetidas", () => {
  beforeEach(() => jest.clearAllMocks());

  it("dada una toma registrada con internet, entonces se cancelan su alarma y repeticiones", async () => {
    (api as jest.Mock).mockResolvedValue({});
    expect(await recordTakenOrQueue("p1", "m1", "2026-11-11T11:00:00Z")).toBe("sent");
    expect(cancelDoseAlarms).toHaveBeenCalledWith({ planId: "p1", medicationId: "m1", scheduledAt: "2026-11-11T11:00:00Z" });
  });
  it("dada una toma marcada sin internet (queda en cola), entonces igual se cancelan las alarmas: la persona ya la tomó", async () => {
    (api as jest.Mock).mockRejectedValue(new TypeError("Network request failed"));
    expect(await recordTakenOrQueue("p1", "m1", "2026-11-11T11:00:00Z")).toBe("queued");
    expect(cancelDoseAlarms).toHaveBeenCalledTimes(1);
  });
  it("dado un rechazo del servidor, entonces no se cancelan las alarmas (la toma no quedó registrada)", async () => {
    (api as jest.Mock).mockRejectedValue(new ApiError(403, "no autorizado"));
    await expect(recordTakenOrQueue("p1", "m1", "2026-11-11T11:00:00Z")).rejects.toThrow();
    expect(cancelDoseAlarms).not.toHaveBeenCalled();
  });
});
