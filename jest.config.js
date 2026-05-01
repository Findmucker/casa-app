/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  moduleNameMapper: {
    "^@/lib/firebase$": "<rootDir>/tests/__mocks__/firebase.ts",
    "^firebase/firestore$": "<rootDir>/tests/__mocks__/firestore.ts",
    "^firebase/auth$": "<rootDir>/tests/__mocks__/auth.ts",
    "^@/(.*)$": "<rootDir>/$1",
  },
  roots: ["<rootDir>/tests"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
};

module.exports = config;
