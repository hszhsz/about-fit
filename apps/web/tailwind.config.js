/**
 * Tailwind v3 config for @about-fit/web.
 *
 * Brand colors are exposed as CSS variables in src/app/globals.css (the
 * --af-* tokens) and consumed via arbitrary values, e.g.
 *   className="bg-[var(--af-coral-500)] text-[var(--af-indigo-950)]"
 * That keeps the design tokens portable (the same vars work in inline
 * style attributes, plain CSS, and Tailwind utilities) and avoids
 * duplicating the palette in two places.
 *
 * If you ever want first-class utilities like `bg-af-coral-500`, mirror
 * the token list under `theme.extend.colors` below.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Used inline via `style={{ fontFamily: ... }}` today; declaring
        // here lets us migrate to `font-fraunces` utilities later without
        // touching every call site.
        fraunces: ["'Fraunces'", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
