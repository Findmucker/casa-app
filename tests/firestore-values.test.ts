import { omitUndefinedValues } from "@/lib/firestore-values";

describe("omitUndefinedValues", () => {
  it("removes optional undefined fields before Firestore creates", () => {
    expect(omitUndefinedValues({
      name: "Meditar",
      reminderTime: undefined,
      days: undefined,
      streak: 0,
    })).toEqual({ name: "Meditar", streak: 0 });
  });

  it("preserves valid falsey values", () => {
    expect(omitUndefinedValues({ done: false, count: 0, note: "", nullable: null }))
      .toEqual({ done: false, count: 0, note: "", nullable: null });
  });
});
