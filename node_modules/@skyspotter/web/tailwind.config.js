/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // iOS dark-mode grouped-table palette: true black base, elevated
        // grays for cards/rows, thin low-contrast separators.
        base: "#000000",
        surface: "#1C1C1E",       // card / grouped section background
        surfaceRaised: "#2C2C2E", // interactive elements sitting on a card (rows, chips)
        separator: "#38383A",
        text: {
          primary: "#F2F2F7",
          muted: "#8E8E93",       // iOS secondaryLabel gray
        },
        // Accent is the one interactive color (selections, sliders, links) —
        // iOS systemBlue. Amber is reserved ONLY for the "overhead now"
        // alert state, so it keeps meaning instead of becoming decoration.
        accent: "#0A84FF",
        amber: "#FF9F0A",
        track: "#64D2FF",         // flight paths / map tracks only
        danger: "#FF453A",        // iOS systemRed — reserved for actual emergency status, nothing else
      },
      fontFamily: {
        // Same stack for display and body — iOS dark mode reads as clean
        // because it doesn't mix typefaces, not because one is fancier.
        // -apple-system renders as true SF Pro on Apple devices.
        display: ["-apple-system", "BlinkMacSystemFont", "'Inter'", "sans-serif"],
        body: ["-apple-system", "BlinkMacSystemFont", "'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
