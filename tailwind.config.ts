import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        mono: ["Geist Mono", "Courier New", "monospace"],
      },
      colors: {
        accent: {
          DEFAULT: "#C4571A",
          light: "rgba(196, 87, 26, 0.08)",
          hover: "#A84815",
        },
        sage: {
          DEFAULT: "#5A7A6B",
          light: "rgba(90, 122, 107, 0.08)",
        },
        paper: "#FAF7F2",
        parchment: "#F5F0E8",
        parchmentDark: "#EDE8DF",
        ink: {
          DEFAULT: "#1C1814",
          secondary: "#6B6259",
          muted: "#A09890",
        },
      },
    },
  },
  plugins: [],
};

export default config;
