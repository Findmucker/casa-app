export interface ThemeConfig {
  bgGradient: string;
}

/**
 * The single visual theme used throughout the app.
 *
 * This is the original rose/pink theme that was previously named
 * "afternoon". Keeping it as an exported constant makes presentation
 * deterministic and avoids timers, hydration differences, and clock-based
 * visual changes.
 */
export const MAIN_THEME: Readonly<ThemeConfig> = Object.freeze({
  bgGradient: "from-rose-50/80 via-pink-50 to-fuchsia-50/60",
});
