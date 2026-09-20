import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12221F",
        teal: {
          DEFAULT: "#0E6B63",
          dark: "#0A4A45",
          light: "#1A8A80",
        },
        paper: "#F4EFE4",
        sand: "#E7DCC8",
        cream: "#FBF8F1",
        alert: "#B42318",
        warn: "#B54708",
        ok: "#067647",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 10px 30px -18px rgba(18, 34, 31, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
