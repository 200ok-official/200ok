import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#20263e",
          dark: "#181d30",
          light: "#2d3451",
        },
        secondary: {
          DEFAULT: "#e6dfcf",
          light: "#f0ebe0",
          dark: "#d4cab7",
        },
        accent: {
          DEFAULT: "#c5ae8c",
          light: "#d4c5a8",
          dark: "#b59b75",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

