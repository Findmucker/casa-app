import { getLevel, getTitle, calculateStats, checkNewBadges, rollLoot, checkLevelUp, BADGES, EQUIPMENT, POINTS, GameStats } from "@/lib/gamification";

describe("Gamification - Levels", () => {
  it("should start at level 1 with 0 points", () => {
    const result = getLevel(0);
    expect(result.level).toBe(1);
    expect(result.xpInLevel).toBe(0);
    expect(result.xpForNext).toBe(50);
  });

  it("should be level 2 at 50 points", () => {
    expect(getLevel(50).level).toBe(2);
  });

  it("should be level 3 at 100 points", () => {
    expect(getLevel(100).level).toBe(3);
  });

  it("should calculate xpInLevel correctly", () => {
    expect(getLevel(75).xpInLevel).toBe(25);
    expect(getLevel(120).xpInLevel).toBe(20);
  });
});

describe("Gamification - Titles", () => {
  it("should return Aprendiz da Casa for level 1", () => {
    expect(getTitle(1)).toBe("Aprendiz da Casa");
  });

  it("should return Organizador for level 5", () => {
    expect(getTitle(5)).toBe("Organizador");
  });

  it("should return Guardião da Casa for level 10", () => {
    expect(getTitle(10)).toBe("Guardião da Casa");
  });

  it("should return highest applicable title", () => {
    expect(getTitle(30)).toBe("Divindade do Lar");
  });
});

describe("Gamification - Stats Calculation", () => {
  const baseStats: GameStats = {
    points: 100,
    totalCompleted: 50,
    maxStreak: 10,
    shoppingDone: 20,
    coisinhasDone: 15,
    projectsDone: 5,
    habitsDone: 10,
  };

  it("should calculate 6 RPG stats", () => {
    const rpgStats = calculateStats(baseStats);
    expect(rpgStats).toHaveLength(6);
  });

  it("should cap stats at maxValue 100", () => {
    const maxedStats: GameStats = { ...baseStats, projectsDone: 100, coisinhasDone: 200 };
    const rpgStats = calculateStats(maxedStats);
    rpgStats.forEach((s) => {
      expect(s.value).toBeLessThanOrEqual(s.maxValue);
    });
  });

  it("should calculate STR from projectsDone * 2", () => {
    const rpgStats = calculateStats(baseStats);
    const str = rpgStats.find((s) => s.key === "str");
    expect(str?.value).toBe(10); // 5 * 2
  });
});

describe("Gamification - Badges", () => {
  it("should detect new badges", () => {
    const stats: GameStats = { points: 0, totalCompleted: 1, maxStreak: 0, shoppingDone: 0, coisinhasDone: 0, projectsDone: 0, habitsDone: 0 };
    const newBadges = checkNewBadges(stats, []);
    expect(newBadges.some((b) => b.id === "first_step")).toBe(true);
  });

  it("should not return already earned badges", () => {
    const stats: GameStats = { points: 0, totalCompleted: 1, maxStreak: 0, shoppingDone: 0, coisinhasDone: 0, projectsDone: 0, habitsDone: 0 };
    const newBadges = checkNewBadges(stats, ["first_step"]);
    expect(newBadges.some((b) => b.id === "first_step")).toBe(false);
  });

  it("should detect streak badges", () => {
    const stats: GameStats = { points: 0, totalCompleted: 0, maxStreak: 5, shoppingDone: 0, coisinhasDone: 0, projectsDone: 0, habitsDone: 0 };
    const newBadges = checkNewBadges(stats, []);
    expect(newBadges.some((b) => b.id === "on_fire")).toBe(true);
  });
});

describe("Gamification - Equipment", () => {
  it("should have 6 equipment slots", () => {
    expect(EQUIPMENT).toHaveLength(6);
  });

  it("should unlock weapon with 3+ projects", () => {
    const stats: GameStats = { points: 0, totalCompleted: 0, maxStreak: 0, shoppingDone: 0, coisinhasDone: 0, projectsDone: 3, habitsDone: 0 };
    const weapon = EQUIPMENT.find((e) => e.slot === "weapon");
    expect(weapon?.condition(stats, 1)).toBe(true);
  });

  it("should lock crown below level 10", () => {
    const stats: GameStats = { points: 0, totalCompleted: 0, maxStreak: 0, shoppingDone: 0, coisinhasDone: 0, projectsDone: 0, habitsDone: 0 };
    const crown = EQUIPMENT.find((e) => e.slot === "crown");
    expect(crown?.condition(stats, 5)).toBe(false);
    expect(crown?.condition(stats, 10)).toBe(true);
  });
});

describe("Gamification - Loot System", () => {
  it("should return null for unknown triggers", () => {
    expect(rollLoot("nonexistent_action")).toBeNull();
  });

  it("should return a Reward or null for valid triggers", () => {
    // Run multiple times to test probabilistic behavior
    let gotLoot = false;
    for (let i = 0; i < 100; i++) {
      const loot = rollLoot("shopping_done");
      if (loot) {
        gotLoot = true;
        expect(loot.trigger).toBe("shopping_done");
        expect(loot.xp).toBeGreaterThan(0);
      }
    }
    // With 40% chance over 100 rolls, extremely unlikely to never drop
    expect(gotLoot).toBe(true);
  });
});

describe("Gamification - Level Up Detection", () => {
  it("should detect level up when crossing threshold", () => {
    const stats: GameStats = { points: 50, totalCompleted: 10, maxStreak: 5, shoppingDone: 10, coisinhasDone: 5, projectsDone: 3, habitsDone: 0 };
    const result = checkLevelUp(49, 50, stats, "shopping_done");
    expect(result.leveledUp).toBe(true);
    expect(result.oldLevel).toBe(1);
    expect(result.newLevel).toBe(2);
  });

  it("should not detect level up within same level", () => {
    const stats: GameStats = { points: 30, totalCompleted: 5, maxStreak: 2, shoppingDone: 5, coisinhasDone: 3, projectsDone: 1, habitsDone: 0 };
    const result = checkLevelUp(29, 30, stats, "shopping_done");
    expect(result.leveledUp).toBe(false);
  });

  it("should return new title on level up", () => {
    const stats: GameStats = { points: 250, totalCompleted: 50, maxStreak: 10, shoppingDone: 20, coisinhasDone: 20, projectsDone: 5, habitsDone: 0 };
    const result = checkLevelUp(249, 250, stats, "project_done");
    expect(result.newTitle).toBeTruthy();
  });
});

describe("Gamification - Points Config", () => {
  it("should have correct point values", () => {
    expect(POINTS.shopping_done).toBe(1);
    expect(POINTS.coisinha_done).toBe(2);
    expect(POINTS.project_done).toBe(5);
    expect(POINTS.habit_check).toBe(2);
    expect(POINTS.streak_5).toBe(10);
    expect(POINTS.streak_10).toBe(25);
    expect(POINTS.streak_30).toBe(100);
  });
});
