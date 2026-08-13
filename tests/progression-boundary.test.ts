import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const fromRoot = (...parts: string[]) => join(process.cwd(), ...parts);
const read = (...parts: string[]) => readFileSync(fromRoot(...parts), "utf8");

describe("inactive progression boundary", () => {
  it("keeps point and level concepts out of the web product UI", () => {
    const profileUi = [
      read("components", "ProfilePage.tsx"),
      read("components", "HouseMembers.tsx"),
      read("app", "dashboard", "DashboardClient.tsx"),
      read("lib", "locales", "pt.ts"),
      read("lib", "locales", "en.ts"),
    ].join("\n");

    expect(profileUi).not.toMatch(
      /\b(?:XP|points?|pontos?|pts|Nível|Nivel|Level)\b|\bNv\./i,
    );
    expect(profileUi).not.toMatch(
      /\b(?:getLevel|getTitle|getPendingBoxes|openLootBox|awardPoints|checkLevelUp)\b/,
    );
  });

  it("does not ship the point-based loot box surfaces", () => {
    expect(existsSync(fromRoot("components", "LootBoxOpener.tsx"))).toBe(false);
    expect(existsSync(fromRoot("components", "Gamification.tsx"))).toBe(false);
  });

  it("wires every completed household activity without recording undo transitions", () => {
    const shopping = read("components", "ShoppingList.tsx");
    const coisinhas = read("components", "PriorityList.tsx");
    const projects = read("components", "ProjectList.tsx");

    expect(shopping).toMatch(/if \(!item\.done\) \{\s*await recordCompletedAction\(userName, "shopping_done"\);/);
    expect(coisinhas).toMatch(/if \(!item\.done\) \{\s*await recordCompletedAction\(userName, "coisinha_done"\);/);
    expect(projects).toMatch(/if \(item\.status !== "concluido" && next === "concluido"\) \{\s*await recordCompletedAction\(userName, "project_done"\);/);
  });
});
