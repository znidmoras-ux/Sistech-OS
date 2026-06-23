import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14213d",
        action: "#0f766e",
        warning: "#b45309",
      },
    },
  },
  plugins: [],
};

export default config;
