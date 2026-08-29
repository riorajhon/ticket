import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: "#07110e",
          900: "#0c1b16",
          800: "#123027",
          700: "#1a4638",
        },
        turf: {
          400: "#6fbf7a",
          500: "#3d9a57",
          600: "#2d7a44",
        },
        volley: {
          400: "#f0a36a",
          500: "#e07a3d",
          600: "#c45f22",
        },
        ticket: {
          ink: "#2a1d12",
          muted: "#5b4630",
          cream: "#f7efe2",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        display: ["var(--font-bebas)", "Impact", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 40px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
