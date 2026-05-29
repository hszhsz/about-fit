/**
 * Tailwind v3 config for @about-fit/web.
 *
 * Design tokens are defined as CSS variables in globals.css (--af-* tokens)
 * and used via arbitrary values, e.g. bg-[var(--af-coral-500)].
 *
 * This config extends Tailwind with custom fonts and additional color tokens
 * for first-class utility access (e.g. bg-coral-500, text-emerald-600).
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        fraunces: ["'Fraunces'", "Georgia", "serif"],
        display: ["'Inter'", "-apple-system", "sans-serif"],
      },
      colors: {
        // Coral palette
        coral: {
          50: "var(--af-coral-50)",
          100: "var(--af-coral-100)",
          200: "var(--af-coral-200)",
          300: "var(--af-coral-300)",
          400: "var(--af-coral-400)",
          500: "var(--af-coral-500)",
          600: "var(--af-coral-600)",
          700: "var(--af-coral-700)",
        },
        // Indigo palette
        indigo: {
          950: "var(--af-indigo-950)",
          900: "var(--af-indigo-900)",
          800: "var(--af-indigo-800)",
          600: "var(--af-indigo-600)",
          500: "var(--af-indigo-500)",
        },
        // Stone palette
        stone: {
          50: "var(--af-stone-50)",
          100: "var(--af-stone-100)",
          200: "var(--af-stone-200)",
          300: "var(--af-stone-300)",
          400: "var(--af-stone-400)",
          500: "var(--af-stone-500)",
          700: "var(--af-stone-700)",
          900: "var(--af-stone-900)",
        },
        // Violet palette
        violet: {
          50: "var(--af-violet-50)",
          100: "var(--af-violet-100)",
          500: "var(--af-violet-500)",
          600: "var(--af-violet-600)",
        },
        // Emerald palette
        emerald: {
          50: "var(--af-emerald-50)",
          100: "var(--af-emerald-100)",
          500: "var(--af-emerald-500)",
          600: "var(--af-emerald-600)",
          700: "var(--af-emerald-700)",
        },
        // Amber palette
        amber: {
          50: "var(--af-amber-50)",
          100: "var(--af-amber-100)",
          400: "var(--af-amber-400)",
          500: "var(--af-amber-500)",
        },
        // Rose palette
        rose: {
          50: "var(--af-rose-50)",
          100: "var(--af-rose-100)",
          500: "var(--af-rose-500)",
          600: "var(--af-rose-600)",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "soft": "0 2px 8px -2px rgba(244, 63, 94, 0.08), 0 4px 16px -4px rgba(244, 63, 94, 0.12)",
        "card": "0 4px 12px -2px rgba(28, 27, 23, 0.06), 0 8px 24px -4px rgba(28, 27, 23, 0.08)",
        "card-hover": "0 12px 24px -8px rgba(244, 63, 94, 0.15), 0 16px 32px -8px rgba(244, 63, 94, 0.1)",
        "glow-coral": "0 0 20px rgba(244, 63, 94, 0.3)",
        "glow-violet": "0 0 20px rgba(124, 58, 237, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "float": "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      backgroundImage: {
        "gradient-coral": "var(--gradient-coral)",
        "gradient-violet": "var(--gradient-violet)",
        "gradient-indigo": "var(--gradient-indigo)",
        "gradient-warm": "var(--gradient-warm)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};