import { MAIN_THEME } from "@/lib/themes";

describe("main visual theme", () => {
  it("keeps the original rose theme as the only deterministic configuration", () => {
    expect(MAIN_THEME).toEqual({
      bgGradient: "from-rose-50/80 via-pink-50 to-fuchsia-50/60",
    });
    expect(Object.isFrozen(MAIN_THEME)).toBe(true);
  });
});
