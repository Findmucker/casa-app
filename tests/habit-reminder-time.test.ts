import { getLocalClock, getReminderOccurrence } from "@/lib/habit-reminder-time";

describe("habit reminder scheduling", () => {
  it("uses Lisbon daylight-saving time instead of the server timezone", () => {
    expect(getLocalClock(new Date("2026-07-13T10:30:00Z"))).toMatchObject({
      date: "2026-07-13",
      day: 1,
      time: "11:30",
      minutes: 690,
    });
  });

  it("returns a reminder occurrence inside the delivery window", () => {
    expect(getReminderOccurrence(new Date("2026-07-13T11:20:00Z"), "12:00")).toMatchObject({
      date: "2026-07-13",
      day: 1,
      elapsedMinutes: 20,
    });
  });

  it("does not send before a reminder or after its recovery window", () => {
    expect(getReminderOccurrence(new Date("2026-07-13T10:30:00Z"), "12:00")).toBeNull();
    expect(getReminderOccurrence(new Date("2026-07-13T15:01:00Z"), "12:00")).toBeNull();
  });

  it("handles reminders whose recovery window crosses midnight", () => {
    expect(getReminderOccurrence(new Date("2026-07-13T23:30:00Z"), "23:00")).toMatchObject({
      date: "2026-07-13",
      day: 1,
      elapsedMinutes: 90,
    });
  });

  it("rejects malformed times", () => {
    expect(getReminderOccurrence(new Date(), "25:00")).toBeNull();
    expect(getReminderOccurrence(new Date(), "noon")).toBeNull();
  });
});
