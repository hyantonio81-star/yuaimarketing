/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      colors: {
        border: "hsl(220 13% 24%)",
        input: "hsl(220 13% 24%)",
        ring: "hsl(173 80% 40%)",
        background: "hsl(224 22% 10%)",
        foreground: "hsl(210 20% 98%)",
        primary: {
          DEFAULT: "hsl(173 80% 40%)",
          foreground: "hsl(224 22% 10%)"
        },
        secondary: {
          DEFAULT: "hsl(220 14% 16%)",
          foreground: "hsl(210 20% 98%)"
        },
        muted: {
          DEFAULT: "hsl(220 14% 16%)",
          foreground: "hsl(215 16% 57%)"
        },
        accent: {
          DEFAULT: "hsl(38 92% 50%)",
          foreground: "hsl(224 22% 10%)"
        },
        destructive: {
          DEFAULT: "hsl(0 63% 51%)",
          foreground: "hsl(210 20% 98%)"
        },
        card: {
          DEFAULT: "hsl(220 14% 14%)",
          foreground: "hsl(210 20% 98%)"
        },
        pillar1: "hsl(173 80% 40%)",
        pillar2: "hsl(262 83% 58%)",
        pillar3: "hsl(38 92% 50%)",
        pillar4: "hsl(199 89% 48%)"
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem"
      },
      animation: {
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite"
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" }
        }
      }
    }
  },
  plugins: []
};
