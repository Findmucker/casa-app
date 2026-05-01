/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  moduleNameMapper: {
    "^@/lib/firebase$": "<rootDir>/__mocks__/firebase.ts",
    "^firebase/firestore$": "<rootDir>/__mocks__/firestore.ts",
    "^firebase/auth$": "<rootDir>/__mocks__/auth.ts",
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

module.exports = config;
