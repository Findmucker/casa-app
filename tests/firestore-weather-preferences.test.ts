import { readFileSync } from "fs";
import { join } from "path";

describe("weather preference security rules", () => {
  it("keeps user weather preferences owner-only", () => {
    const rules = readFileSync(join(process.cwd(), "firestore.rules"), "utf8");
    const userPreferencesRule = rules.match(
      /match \/preferences\/\{document\} \{[\s\S]*?\n\s*\}/
    )?.[0];

    expect(userPreferencesRule).toBeDefined();
    expect(userPreferencesRule).toContain(
      "allow read, write: if signedIn() && request.auth.uid == uid;"
    );
    expect(userPreferencesRule).not.toContain("currentHouseId");
  });
});
