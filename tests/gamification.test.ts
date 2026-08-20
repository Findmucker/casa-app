import {
  BADGES,
  LOOT_POOL,
  activityStatsFromData,
  calculateStats,
  checkNewBadges,
  type GameStats,
} from "@/lib/gamification";

const emptyStats: GameStats = {
  totalCompleted: 0,
  maxStreak: 0,
  shoppingDone: 0,
  coisinhasDone: 0,
  projectsDone: 0,
  habitsDone: 0,
};

describe("Activity profile - Stats Calculation", () => {
  const stats: GameStats = {
    totalCompleted: 50,
    maxStreak: 10,
    shoppingDone: 20,
    coisinhasDone: 15,
    projectsDone: 5,
    habitsDone: 10,
  };

  it("calculates all six activity attributes", () => {
    expect(calculateStats(stats)).toHaveLength(6);
  });

  it("caps activity attributes at 100", () => {
    const maxedStats: GameStats = { ...stats, projectsDone: 100, coisinhasDone: 200 };

    calculateStats(maxedStats).forEach((activityStat) => {
      expect(activityStat.value).toBeLessThanOrEqual(activityStat.maxValue);
    });
  });

  it("calculates the project attribute from completed projects", () => {
    const projectStat = calculateStats(stats).find((activityStat) => activityStat.key === "str");

    expect(projectStat?.value).toBe(15);
  });

  it("ignores historical progression fields when reading activity", () => {
    expect(activityStatsFromData({ points: 500, boxesOpened: 7, totalCompleted: 4 })).toEqual({
      totalCompleted: 4,
      maxStreak: 0,
      shoppingDone: 0,
      coisinhasDone: 0,
      projectsDone: 0,
      habitsDone: 0,
    });
  });
});

describe("Activity profile - Achievements", () => {
  it("detects a first completed action", () => {
    const newBadges = checkNewBadges({ ...emptyStats, totalCompleted: 1 }, []);

    expect(newBadges.some((badge) => badge.id === "first_step")).toBe(true);
  });

  it("does not return an already earned achievement", () => {
    const newBadges = checkNewBadges({ ...emptyStats, totalCompleted: 1 }, ["first_step"]);

    expect(newBadges.some((badge) => badge.id === "first_step")).toBe(false);
  });

  it("detects achievements from habit streaks", () => {
    const newBadges = checkNewBadges({ ...emptyStats, maxStreak: 5 }, []);

    expect(newBadges.some((badge) => badge.id === "on_fire")).toBe(true);
  });

  it("only exposes achievements backed by completed actions or streaks", () => {
    expect(BADGES.map((badge) => badge.id)).toEqual([
      "first_step",
      "on_fire",
      "unstoppable",
      "legend",
      "shopaholic",
      "doer",
      "architect",
    ]);
  });
});

describe("Activity profile - Existing inventory", () => {
  it("keeps the cosmetic inventory catalog available", () => {
    expect(LOOT_POOL).toHaveLength(30);
    expect(new Set(LOOT_POOL.map((item) => item.slot))).toEqual(
      new Set(["helmet", "weapon", "shield", "armor", "boots", "accessory"]),
    );
  });
});
