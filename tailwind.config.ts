import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E6FD9",
          light: "#E6F0FD",
          dark: "#154F9E",
        },
        navy: "#0B2545",
        surface: {
          DEFAULT: "#FFFFFF",
          soft: "#F5F9FE",
        },
        status: {
          confirmed: "#16A34A",
          pending: "#D97706",
          cancelled: "#DC2626",
          inProgress: "#2563EB",
        },
      },
      fontFamily: {
        heading: ["var(--font-poppins)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 4px 14px rgba(11, 37, 69, 0.08)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
